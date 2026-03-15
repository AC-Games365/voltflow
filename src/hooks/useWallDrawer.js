import { useState, useCallback, useEffect } from 'react';
import { useReactFlow } from 'reactflow';

const getId = () => `wall_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

export const useWallDrawer = ({ isDrawingWall, setIsDrawingWall, nodes, setNodes, takeSnapshot, texts }) => {
  const [wallStartPoint, setWallStartPoint] = useState(null);
  const [currentPath, setCurrentPath] = useState([]);
  const { screenToFlowPosition, getZoom } = useReactFlow();

  const SNAP_GRID = 15;
  const SNAP_RADIUS = 20;

  useEffect(() => {
    if (!isDrawingWall) {
      setWallStartPoint(null);
      setCurrentPath([]);
      setNodes((nds) => nds.filter((n) => n.id !== 'wall_preview'));
    }
  }, [isDrawingWall, setNodes]);

  const getPoint = useCallback((rawPos) => {
    let point = {
      x: Math.round(rawPos.x / SNAP_GRID) * SNAP_GRID,
      y: Math.round(rawPos.y / SNAP_GRID) * SNAP_GRID
    };

    nodes.forEach(node => {
      if (node.type === 'wall' && node.id !== 'wall_preview') {
        const endpoints = [
          { x: node.position.x, y: node.position.y },
          { x: node.position.x + (node.style.width || 0), y: node.position.y + (node.style.height || 0) }
        ];
        endpoints.forEach(ep => {
          const dist = Math.sqrt(Math.pow(rawPos.x - ep.x, 2) + Math.pow(rawPos.y - ep.y, 2));
          if (dist < SNAP_RADIUS) {
            point = { x: ep.x, y: ep.y };
          }
        });
      }
    });
    return point;
  }, [nodes]);

  const onPaneClick = useCallback((event) => {
    if (!isDrawingWall) return;
    
    // Support shift key for strict orthographic (90/180) locking
    const isShiftPressed = event.shiftKey;
    
    const rawPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    let currentPoint = getPoint(rawPos);

    if (!wallStartPoint) {
      setWallStartPoint(currentPoint);
      setCurrentPath([currentPoint]);
    } else {
      let endPoint = currentPoint;
      let dx = endPoint.x - wallStartPoint.x;
      let dy = endPoint.y - wallStartPoint.y;
      
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;

      takeSnapshot();

      // Si Shift n'est pas pressé, on autorise le dessin libre (diagonal possible)
      // Si Shift est pressé, on force à 90° (horizontal ou vertical)
      if (isShiftPressed) {
        if (Math.abs(dx) > Math.abs(dy)) {
          endPoint = { x: currentPoint.x, y: wallStartPoint.y };
        } else {
          endPoint = { x: wallStartPoint.x, y: currentPoint.y };
        }
      }

      // Calcul des dimensions et position pour un mur dessiné librement (qui peut donc être en diagonale)
      const distance = Math.sqrt(Math.pow(endPoint.x - wallStartPoint.x, 2) + Math.pow(endPoint.y - wallStartPoint.y, 2));
      const angle = Math.atan2(endPoint.y - wallStartPoint.y, endPoint.x - wallStartPoint.x) * (180 / Math.PI);
      
      // On centre le point d'origine de la rotation pour simplifier le placement
      // L'origine par défaut d'une div est top-left (0,0), on va utiliser transform-origin: 0 50%
      const width = distance;
      const height = 15; // Épaisseur standard
      
      // La position du noeud est exactement le point de départ, on compense juste la hauteur
      const x = wallStartPoint.x;
      const y = wallStartPoint.y - (height / 2);

      const newWall = {
        id: getId(),
        type: 'wall',
        position: { x, y },
        data: { label: '', rotation: angle, length: Math.round(distance) },
        style: { width, height, backgroundColor: '#333' },
      };

      const startOfPath = currentPath[0];
      const distToStart = Math.sqrt(Math.pow(endPoint.x - startOfPath.x, 2) + Math.pow(endPoint.y - startOfPath.y, 2));
      
      // Fermeture de la pièce si on est proche du point de départ
      if (currentPath.length >= 2 && distToStart < SNAP_RADIUS * 2) {
        
        // Recalcul du dernier mur pour fermer parfaitement
        const finalDistance = Math.sqrt(Math.pow(startOfPath.x - wallStartPoint.x, 2) + Math.pow(startOfPath.y - wallStartPoint.y, 2));
        const finalAngle = Math.atan2(startOfPath.y - wallStartPoint.y, startOfPath.x - wallStartPoint.x) * (180 / Math.PI);
        
        const closingWall = {
          id: getId(),
          type: 'wall',
          position: { x: wallStartPoint.x, y: wallStartPoint.y - (15 / 2) },
          data: { label: '', rotation: finalAngle, length: Math.round(finalDistance) },
          style: { width: finalDistance, height: 15, backgroundColor: '#333' },
        };

        const finalPath = [...currentPath, startOfPath];
        const minX = Math.min(...finalPath.map(p => p.x));
        const maxX = Math.max(...finalPath.map(p => p.x));
        const minY = Math.min(...finalPath.map(p => p.y));
        const maxY = Math.max(...finalPath.map(p => p.y));

        const roomNode = {
          id: `room_${Date.now()}`,
          type: 'room',
          position: { x: minX, y: minY },
          data: { label: texts.new_room || 'Pièce', color: '#009688' },
          style: { width: Math.max(maxX - minX, 100), height: Math.max(maxY - minY, 100), zIndex: -1 }
        };

        setNodes(nds => nds.filter(n => n.id !== 'wall_preview').concat(closingWall, roomNode));
        setIsDrawingWall(false); // On a fini la pièce
        setWallStartPoint(null);
        setCurrentPath([]);
      } else {
        // Continue le mur
        setNodes(nds => nds.filter(n => n.id !== 'wall_preview').concat(newWall));
        setWallStartPoint(endPoint);
        setCurrentPath(prev => [...prev, endPoint]);
      }
    }
  }, [isDrawingWall, wallStartPoint, currentPath, getPoint, screenToFlowPosition, setNodes, takeSnapshot, texts.new_room, setIsDrawingWall]);

  const onPaneMouseMove = useCallback((event) => {
    if (!isDrawingWall || !wallStartPoint) return;

    const isShiftPressed = event.shiftKey;
    const rawPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    let currentPoint = getPoint(rawPos);
    
    let endPoint = currentPoint;
    
    if (isShiftPressed) {
      let dx = Math.abs(currentPoint.x - wallStartPoint.x);
      let dy = Math.abs(currentPoint.y - wallStartPoint.y);
      if (dx > dy) {
        endPoint = { x: currentPoint.x, y: wallStartPoint.y };
      } else {
        endPoint = { x: wallStartPoint.x, y: currentPoint.y };
      }
    }

    const startOfPath = currentPath[0];
    if (startOfPath) {
        const distToStart = Math.sqrt(Math.pow(endPoint.x - startOfPath.x, 2) + Math.pow(endPoint.y - startOfPath.y, 2));
        if (currentPath.length >= 2 && distToStart < SNAP_RADIUS * 2) {
            // Magnetisme vers le point de départ pour aider à fermer la pièce
            endPoint = startOfPath;
        }
    }

    const distance = Math.sqrt(Math.pow(endPoint.x - wallStartPoint.x, 2) + Math.pow(endPoint.y - wallStartPoint.y, 2));
    const angle = Math.atan2(endPoint.y - wallStartPoint.y, endPoint.x - wallStartPoint.x) * (180 / Math.PI);
    
    const width = Math.max(distance, 15);
    const height = 15;
    const x = wallStartPoint.x;
    const y = wallStartPoint.y - (height / 2);

    const lengthCm = Math.round(width);

    setNodes((nds) => nds.filter((n) => n.id !== 'wall_preview').concat({
      id: 'wall_preview',
      type: 'wall',
      position: { x, y },
      data: { label: `${lengthCm} cm`, isPreview: true, rotation: angle, length: lengthCm },
      style: { width, height, opacity: 0.5, zIndex: 1000, pointerEvents: 'none', backgroundColor: '#007bff' },
    }));
  }, [isDrawingWall, wallStartPoint, currentPath, getPoint, screenToFlowPosition, setNodes]);

  return { onPaneClick, onPaneMouseMove };
};