import { useState, useCallback, useEffect } from 'react';
import { useReactFlow } from 'reactflow';

const getId = () => `dndnode_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

export const useWallDrawer = ({ isDrawingWall, setIsDrawingWall, setNodes, takeSnapshot, texts }) => {
  const [wallStartPoint, setWallStartPoint] = useState(null);
  const [currentPath, setCurrentPath] = useState([]);
  const { screenToFlowPosition } = useReactFlow();

  useEffect(() => {
    if (!isDrawingWall) {
      setWallStartPoint(null);
      setCurrentPath([]);
      setNodes((nds) => nds.filter((n) => n.id !== 'wall_preview'));
    }
  }, [isDrawingWall, setNodes]);

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
      let actualNextPoint = isHorizontal ? { x: snappedPos.x, y: wallStartPoint.y } : { x: wallStartPoint.x, y: snappedPos.y };
      
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
      
      setNodes((nds) => nds.filter(n => n.id !== 'wall_preview').concat(newWall));
      setWallStartPoint(actualNextPoint);
      setCurrentPath(cp => [...cp, actualNextPoint]);
    }
  }, [isDrawingWall, wallStartPoint, screenToFlowPosition, setNodes, takeSnapshot]);

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
    if (isHorizontal) {
      width = Math.max(Math.abs(actualNextPoint.x - wallStartPoint.x) + 15, 15);
      x = Math.min(wallStartPoint.x, actualNextPoint.x) - 7.5;
      y = wallStartPoint.y - 7.5;
    } else {
      height = Math.max(Math.abs(actualNextPoint.y - wallStartPoint.y) + 15, 15);
      x = wallStartPoint.x - 7.5;
      y = Math.min(wallStartPoint.y, actualNextPoint.y) - 7.5;
    }

    setNodes((nds) => nds.filter((n) => n.id !== 'wall_preview').concat({
      id: 'wall_preview', type: 'wall', position: { x, y },
      data: { label: '', color: '#007bff' },
      style: { width, height, opacity: 0.9, zIndex: 1000, pointerEvents: 'none' },
    }));
  }, [isDrawingWall, wallStartPoint, screenToFlowPosition, setNodes]);

  return { onPaneClick, onPaneMouseMove };
};