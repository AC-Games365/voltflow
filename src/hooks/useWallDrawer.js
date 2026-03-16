import { useState, useCallback, useEffect } from 'react';
import { useReactFlow } from 'reactflow';

const getId = () => `wall_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Fonction utilitaire sortie du hook pour plus de performance
const getWallEndpoints = (wallNode) => {
  const pos = wallNode.position;
  const width = wallNode.style?.width || 0;
  const height = wallNode.style?.height || 15;
  const rotation = (wallNode.data?.rotation || 0) * Math.PI / 180;

  const x1 = pos.x;
  const y1 = pos.y + height / 2;
  const x2 = pos.x + width * Math.cos(rotation);
  const y2 = pos.y + height / 2 + width * Math.sin(rotation);

  return [{ x: x1, y: y1 }, { x: x2, y: y2 }];
};

// Fonction pour couper un mur si un point tombe dessus (Auto-Split)
const splitWallsIfNeeded = (point, nodes, getIdFunc) => {
  let nodesToKeep = [];
  let newSplitWalls = [];
  let hasSplit = false;

  nodes.forEach(node => {
    if (node.type !== 'wall' || node.id === 'wall_preview') {
      nodesToKeep.push(node);
      return;
    }

    const [A, B] = getWallEndpoints(node);

    const distA = Math.hypot(point.x - A.x, point.y - A.y);
    const distB = Math.hypot(point.x - B.x, point.y - B.y);
    if (distA < 5 || distB < 5) {
      nodesToKeep.push(node);
      return;
    }

    const distAB = Math.hypot(A.x - B.x, A.y - B.y);
    // Si la somme des distances est égale à la longueur totale (avec une marge d'erreur de 1px)
    if (Math.abs((distA + distB) - distAB) < 1.0) {
      hasSplit = true;

      const angle1 = Math.atan2(point.y - A.y, point.x - A.x) * (180 / Math.PI);
      newSplitWalls.push({
        ...node,
        id: getIdFunc(),
        position: { x: A.x, y: A.y - (node.style.height / 2) },
        data: { ...node.data, rotation: angle1, length: Math.round(distA) },
        style: { ...node.style, width: distA },
      });

      const angle2 = Math.atan2(B.y - point.y, B.x - point.x) * (180 / Math.PI);
      newSplitWalls.push({
        ...node,
        id: getIdFunc(),
        position: { x: point.x, y: point.y - (node.style.height / 2) },
        data: { ...node.data, rotation: angle2, length: Math.round(distB) },
        style: { ...node.style, width: distB },
      });
    } else {
      nodesToKeep.push(node);
    }
  });

  return hasSplit ? [...nodesToKeep, ...newSplitWalls] : nodes;
};


export const useWallDrawer = ({ isDrawingWall, setIsDrawingWall, nodes, setNodes, takeSnapshot }) => {
  const [wallStartPoint, setWallStartPoint] = useState(null);
  const [currentPath, setCurrentPath] = useState([]);
  const { screenToFlowPosition } = useReactFlow();

  const SNAP_GRID = 15;
  const SNAP_RADIUS = 20;

  // 1. Annulation / Nettoyage propre
  const cancelDrawing = useCallback(() => {
    setIsDrawingWall(false);
    setWallStartPoint(null);
    setCurrentPath([]);
    setNodes((nds) => nds.filter((n) => n.id !== 'wall_preview'));
  }, [setIsDrawingWall, setNodes]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isDrawingWall) cancelDrawing();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawingWall, cancelDrawing]);

  useEffect(() => {
    if (!isDrawingWall) cancelDrawing();
  }, [isDrawingWall, cancelDrawing]);


  // 2. Magnétisme complet (Bouts de murs ET Corps de murs)
  const getPoint = useCallback((rawPos) => {
    let point = {
      x: Math.round(rawPos.x / SNAP_GRID) * SNAP_GRID,
      y: Math.round(rawPos.y / SNAP_GRID) * SNAP_GRID
    };

    let minDistance = SNAP_RADIUS;
    let bestSnapPoint = null;

    nodes.forEach(node => {
      if (node.type === 'wall' && node.id !== 'wall_preview') {
        const [A, B] = getWallEndpoints(node);

        // A. Priorité aux extrémités (Coins)
        [A, B].forEach(ep => {
          const dist = Math.hypot(rawPos.x - ep.x, rawPos.y - ep.y);
          if (dist < minDistance) {
            minDistance = dist;
            bestSnapPoint = { x: ep.x, y: ep.y };
          }
        });

        // B. S'aimanter sur le "corps" du mur (Intersections en T)
        const l2 = Math.pow(A.x - B.x, 2) + Math.pow(A.y - B.y, 2);
        if (l2 !== 0) {
          let t = ((rawPos.x - A.x) * (B.x - A.x) + (rawPos.y - A.y) * (B.y - A.y)) / l2;
          t = Math.max(0, Math.min(1, t)); // Contraint t entre 0 et 1 (sur le segment)

          const projX = A.x + t * (B.x - A.x);
          const projY = A.y + t * (B.y - A.y);
          const distToSegment = Math.hypot(rawPos.x - projX, rawPos.y - projY);

          if (distToSegment < minDistance) {
            minDistance = distToSegment;
            bestSnapPoint = { x: projX, y: projY };
          }
        }
      }
    });

    return bestSnapPoint || point;
  }, [nodes]);

  // Anti-doublons
  const wallAlreadyExists = useCallback((start, end, allNodes) => {
    const tolerance = 2;
    return allNodes.some(n => {
      if (n.type !== 'wall' || n.id === 'wall_preview') return false;
      const [wallStart, wallEnd] = getWallEndpoints(n);

      const same = Math.abs(start.x - wallStart.x) < tolerance &&
          Math.abs(start.y - wallStart.y) < tolerance &&
          Math.abs(end.x - wallEnd.x) < tolerance &&
          Math.abs(end.y - wallEnd.y) < tolerance;

      const mirror = Math.abs(start.x - wallEnd.x) < tolerance &&
          Math.abs(start.y - wallEnd.y) < tolerance &&
          Math.abs(end.x - wallStart.x) < tolerance &&
          Math.abs(end.y - wallStart.y) < tolerance;
      return same || mirror;
    });
  }, []);

  const onPaneClick = useCallback((event) => {
    if (!isDrawingWall) return;
    const isShiftPressed = event.shiftKey;
    const rawPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    let currentPoint = getPoint(rawPos);

    if (!wallStartPoint) {
      setNodes(nds => nds.filter(n => n.id !== 'wall_preview'));
      setWallStartPoint(currentPoint);
      setCurrentPath([currentPoint]);
    } else {
      let endPoint = currentPoint;
      let dx = endPoint.x - wallStartPoint.x;
      let dy = endPoint.y - wallStartPoint.y;

      // Anti-murs fantômes
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;

      if (isShiftPressed) {
        if (Math.abs(dx) > Math.abs(dy)) {
          endPoint = { x: currentPoint.x, y: wallStartPoint.y };
        } else {
          endPoint = { x: wallStartPoint.x, y: currentPoint.y };
        }
      }

      if (takeSnapshot) takeSnapshot();

      const distance = Math.hypot(endPoint.x - wallStartPoint.x, endPoint.y - wallStartPoint.y);
      const angle = Math.atan2(endPoint.y - wallStartPoint.y, endPoint.x - wallStartPoint.x) * (180 / Math.PI);

      const newWall = {
        id: getId(),
        type: 'wall',
        position: { x: wallStartPoint.x, y: wallStartPoint.y - 7.5 },
        data: { label: '', rotation: angle, length: Math.round(distance) },
        style: { width: distance, height: 15 },
      };

      const startOfPath = currentPath[0];
      const distToStart = Math.hypot(endPoint.x - startOfPath.x, endPoint.y - startOfPath.y);
      const isClosing = currentPath.length >= 2 && distToStart < SNAP_RADIUS;

      let currentNodes = nodes;

      if (isClosing) {
        const finalDistance = Math.hypot(startOfPath.x - wallStartPoint.x, startOfPath.y - wallStartPoint.y);
        const finalAngle = Math.atan2(startOfPath.y - wallStartPoint.y, startOfPath.x - wallStartPoint.x) * (180 / Math.PI);
        const closingWall = {
          id: getId(),
          type: 'wall',
          position: { x: wallStartPoint.x, y: wallStartPoint.y - 7.5 },
          data: { label: '', rotation: finalAngle, length: Math.round(finalDistance) },
          style: { width: finalDistance, height: 15 },
        };

        // Auto-split au moment de fermer la pièce
        currentNodes = splitWallsIfNeeded(wallStartPoint, currentNodes, getId);
        currentNodes = splitWallsIfNeeded(startOfPath, currentNodes, getId);

        setNodes(currentNodes.filter(n => n.id !== 'wall_preview').concat(closingWall));
        setIsDrawingWall(false);
        setWallStartPoint(null);
        setCurrentPath([]);
      } else {
        if (wallAlreadyExists(wallStartPoint, endPoint, currentNodes)) {
          setWallStartPoint(endPoint);
          setCurrentPath(prev => [...prev, endPoint]);
          return;
        }

        // Auto-split au moment de créer un nouveau segment
        currentNodes = splitWallsIfNeeded(wallStartPoint, currentNodes, getId);
        currentNodes = splitWallsIfNeeded(endPoint, currentNodes, getId);

        setNodes(currentNodes.filter(n => n.id !== 'wall_preview').concat(newWall));
        setWallStartPoint(endPoint);
        setCurrentPath(prev => [...prev, endPoint]);
      }
    }
  }, [isDrawingWall, screenToFlowPosition, takeSnapshot, currentPath, getPoint, setIsDrawingWall, setNodes, wallStartPoint, nodes, wallAlreadyExists]);

  const onPaneMouseMove = useCallback((event) => {
    if (!isDrawingWall || !wallStartPoint) return;

    const rawPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    let currentPoint = getPoint(rawPos);

    setNodes(nds => {
      const dx = currentPoint.x - wallStartPoint.x;
      const dy = currentPoint.y - wallStartPoint.y;
      const distance = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      const height = 15;

      const existingWall = nds.find(n => n.id === 'wall_preview');

      if (existingWall) {
        return nds.map(n => n.id === 'wall_preview' ? {
          ...n,
          data: { ...n.data, rotation: angle, length: Math.round(distance) },
          position: { x: wallStartPoint.x, y: wallStartPoint.y - (n.style?.height || height) / 2 },
          style: { ...n.style, width: distance }
        } : n);
      } else {
        return [...nds, {
          id: 'wall_preview',
          type: 'wall',
          position: { x: wallStartPoint.x, y: wallStartPoint.y - (height / 2) },
          data: { label: '', rotation: angle, length: Math.round(distance) },
          style: { width: distance, height, backgroundColor: 'transparent' },
        }];
      }
    });
  }, [isDrawingWall, screenToFlowPosition, getPoint, setNodes, wallStartPoint]);

  const onPaneContextMenu = useCallback((event) => {
    if (isDrawingWall) {
      event.preventDefault();
      cancelDrawing();
    }
  }, [isDrawingWall, cancelDrawing]);

  return { onPaneClick, onPaneMouseMove, onPaneContextMenu };
};