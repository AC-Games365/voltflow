import { useState, useCallback, useEffect } from 'react';
import { useReactFlow } from 'reactflow';

const getId = () => `wall_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

export const useWallDrawer = ({ isDrawingWall, setIsDrawingWall, nodes, setNodes, takeSnapshot, texts }) => {
  const [wallStartPoint, setWallStartPoint] = useState(null);
  const [currentPath, setCurrentPath] = useState([]);
  const { screenToFlowPosition } = useReactFlow();

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
    
    const rawPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const currentPoint = getPoint(rawPos);

    if (!wallStartPoint) {
      setWallStartPoint(currentPoint);
      setCurrentPath([currentPoint]);
    } else {
      const dx = Math.abs(currentPoint.x - wallStartPoint.x);
      const dy = Math.abs(currentPoint.y - wallStartPoint.y);
      
      if (dx < 5 && dy < 5) return;

      takeSnapshot();

      const isHorizontal = dx > dy;
      const endPoint = isHorizontal 
        ? { x: currentPoint.x, y: wallStartPoint.y } 
        : { x: wallStartPoint.x, y: currentPoint.y };

      const width = isHorizontal ? Math.abs(endPoint.x - wallStartPoint.x) : 15;
      const height = isHorizontal ? 15 : Math.abs(endPoint.y - wallStartPoint.y);
      const x = Math.min(wallStartPoint.x, endPoint.x);
      const y = Math.min(wallStartPoint.y, endPoint.y);

      const newWall = {
        id: getId(),
        type: 'wall',
        position: { x, y },
        data: { label: '' },
        style: { width, height, backgroundColor: '#333' },
      };

      const startOfPath = currentPath[0];
      const distToStart = Math.sqrt(Math.pow(endPoint.x - startOfPath.x, 2) + Math.pow(endPoint.y - startOfPath.y, 2));
      
      if (currentPath.length >= 3 && distToStart < SNAP_RADIUS) {
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
          style: { width: maxX - minX, height: maxY - minY, zIndex: -1 }
        };

        setNodes(nds => nds.filter(n => n.id !== 'wall_preview').concat(newWall, roomNode));
        setIsDrawingWall(false);
      } else {
        setNodes(nds => nds.filter(n => n.id !== 'wall_preview').concat(newWall));
        setWallStartPoint(endPoint);
        setCurrentPath(prev => [...prev, endPoint]);
      }
    }
  }, [isDrawingWall, wallStartPoint, currentPath, getPoint, screenToFlowPosition, setNodes, takeSnapshot, texts.new_level, setIsDrawingWall]);

  const onPaneMouseMove = useCallback((event) => {
    if (!isDrawingWall || !wallStartPoint) return;

    const rawPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const currentPoint = getPoint(rawPos);
    
    const dx = Math.abs(currentPoint.x - wallStartPoint.x);
    const dy = Math.abs(currentPoint.y - wallStartPoint.y);
    const isHorizontal = dx > dy;

    const endPoint = isHorizontal 
      ? { x: currentPoint.x, y: wallStartPoint.y } 
      : { x: wallStartPoint.x, y: currentPoint.y };

    const width = isHorizontal ? Math.max(Math.abs(endPoint.x - wallStartPoint.x), 15) : 15;
    const height = isHorizontal ? 15 : Math.max(Math.abs(endPoint.y - wallStartPoint.y), 15);
    const x = Math.min(wallStartPoint.x, endPoint.x);
    const y = Math.min(wallStartPoint.y, endPoint.y);

    const lengthCm = Math.round(isHorizontal ? width : height);

    setNodes((nds) => nds.filter((n) => n.id !== 'wall_preview').concat({
      id: 'wall_preview',
      type: 'wall',
      position: { x, y },
      data: { label: `${lengthCm} cm`, isPreview: true },
      style: { width, height, opacity: 0.5, zIndex: 1000, pointerEvents: 'none', backgroundColor: '#007bff' },
    }));
  }, [isDrawingWall, wallStartPoint, getPoint, screenToFlowPosition, setNodes]);

  return { onPaneClick, onPaneMouseMove };
};