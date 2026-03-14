import { useState, useCallback, useEffect } from 'react';
import { useReactFlow } from 'reactflow';

const getId = () => `dndnode_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

export const useWallDrawer = ({ isDrawingWall, setIsDrawingWall, nodes, setNodes, takeSnapshot, texts }) => {
  const [wallStartPoint, setWallStartPoint] = useState(null);
  const [currentPath, setCurrentPath] = useState([]);
  const { screenToFlowPosition } = useReactFlow();

  // Nettoyer l'aperçu si on quitte le mode dessin
  useEffect(() => {
    if (!isDrawingWall) {
      setWallStartPoint(null);
      setCurrentPath([]);
      setNodes((nds) => nds.filter((n) => n.id !== 'wall_preview'));
    }
  }, [isDrawingWall, setNodes]);

  // Clic pour commencer ou valider un mur
  const onPaneClick = useCallback((event) => {
    if (!isDrawingWall) return;
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const snap = 15;
    const snappedPos = { x: Math.round(position.x / snap) * snap, y: Math.round(position.y / snap) * snap };

    if (!wallStartPoint) {
      setWallStartPoint(snappedPos);
      setCurrentPath([snappedPos]);
    } else {
      const dx = snappedPos.x - wallStartPoint.x;
      const dy = snappedPos.y - wallStartPoint.y;
      if (dx === 0 && dy === 0) return;

      takeSnapshot();

      const isHorizontal = Math.abs(dx) > Math.abs(dy);
      let actualNextPoint = isHorizontal 
        ? { x: snappedPos.x, y: wallStartPoint.y } 
        : { x: wallStartPoint.x, y: snappedPos.y };

      let isClosed = false;
      if (currentPath.length >= 3) {
        const startX = currentPath[0].x;
        const startY = currentPath[0].y;
        if (isHorizontal && wallStartPoint.y === startY && ((startX >= wallStartPoint.x && startX <= actualNextPoint.x) || (startX <= wallStartPoint.x && startX >= actualNextPoint.x))) {
          isClosed = true;
          actualNextPoint.x = startX;
        } else if (!isHorizontal && wallStartPoint.x === startX && ((startY >= wallStartPoint.y && startY <= actualNextPoint.y) || (startY <= wallStartPoint.y && startY >= actualNextPoint.y))) {
          isClosed = true;
          actualNextPoint.y = startY;
        }
      }

      let width = 15, height = 15, x = 0, y = 0;
      if (isHorizontal) {
        width = Math.max(Math.abs(actualNextPoint.x - wallStartPoint.x) + 15, 15);
        x = Math.min(wallStartPoint.x, actualNextPoint.x) - 7.5;
        y = wallStartPoint.y - 7.5;
      } else {
        height = Math.max(Math.abs(actualNextPoint.y - wallStartPoint.y) + 15, 15);
        x = wallStartPoint.x - 7.5;
        y = Math.min(wallStartPoint.y, actualNextPoint.y) - 7.5;
      }

      const newWall = {
        id: getId(), type: 'wall', position: { x, y },
        data: { label: '', color: '#333333', width, height },
        style: { width, height },
      };

      const isDuplicate = nodes.some(n => n.type === 'wall' && n.position.x === x && n.position.y === y && n.style.width === width && n.style.height === height);

      if (isClosed) {
        const finalPath = [...currentPath, actualNextPoint];
        const minX = Math.min(...finalPath.map(p => p.x));
        const maxX = Math.max(...finalPath.map(p => p.x));
        const minY = Math.min(...finalPath.map(p => p.y));
        const maxY = Math.max(...finalPath.map(p => p.y));
        
        const roomNode = {
          id: getId(), type: 'room', position: { x: minX + 7.5, y: minY + 7.5 },
          data: { label: texts.new_room || 'Nouvelle Pièce', color: '#009688', rotation: 0 },
          style: { width: Math.max(15, (maxX - minX) - 15), height: Math.max(15, (maxY - minY) - 15), zIndex: -1 }
        };
        
        setNodes((nds) => {
          let updatedNodes = nds.filter((n) => n.id !== 'wall_preview');
          if (!isDuplicate) updatedNodes = updatedNodes.concat(newWall);
          return updatedNodes.concat(roomNode);
        });
        
        setIsDrawingWall(false);
      } else {
        setNodes((nds) => {
          let updatedNodes = nds.filter((n) => n.id !== 'wall_preview');
          return isDuplicate ? updatedNodes : updatedNodes.concat(newWall);
        });
        setWallStartPoint(actualNextPoint);
        setCurrentPath(cp => [...cp, actualNextPoint]);
      }
    }
  }, [isDrawingWall, wallStartPoint, currentPath, screenToFlowPosition, setNodes, texts.new_room, takeSnapshot, nodes, setIsDrawingWall]);

  const onPaneMouseMove = useCallback((event) => {
    if (!isDrawingWall || !wallStartPoint) return;
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const snap = 15;
    const snappedPos = { x: Math.round(position.x / snap) * snap, y: Math.round(position.y / snap) * snap };
    const dx = snappedPos.x - wallStartPoint.x;
    const dy = snappedPos.y - wallStartPoint.y;
    const isHorizontal = Math.abs(dx) > Math.abs(dy);

    const actualNextPoint = isHorizontal ? { x: snappedPos.x, y: wallStartPoint.y } : { x: wallStartPoint.x, y: snappedPos.y };

    let width = 15, height = 15, x = 0, y = 0;
    let length = 0;
    if (isHorizontal) {
      width = Math.max(Math.abs(actualNextPoint.x - wallStartPoint.x) + 15, 15);
      length = width - 15;
      x = Math.min(wallStartPoint.x, actualNextPoint.x) - 7.5;
      y = wallStartPoint.y - 7.5;
    } else {
      height = Math.max(Math.abs(actualNextPoint.y - wallStartPoint.y) + 15, 15);
      length = height - 15;
      x = wallStartPoint.x - 7.5;
      y = Math.min(wallStartPoint.y, actualNextPoint.y) - 7.5;
    }

    setNodes((nds) => nds.filter((n) => n.id !== 'wall_preview').concat({
      id: 'wall_preview', type: 'wall', position: { x, y },
      data: { label: `${Math.round(length)} cm`, isPreview: true },
      style: { width, height, opacity: 0.9, zIndex: 1000, pointerEvents: 'none', backgroundColor: '#007bff' },
    }));
  }, [isDrawingWall, wallStartPoint, screenToFlowPosition, setNodes]);

  return { onPaneClick, onPaneMouseMove };
};