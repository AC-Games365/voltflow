import { useState, useCallback, useEffect } from 'react';
import { useReactFlow, useStoreApi } from 'reactflow';

const getId = () => `wall_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const SNAP_GRID = 15; // Exported for useAngleNodes

export const getWallEndpoints = (wallNode) => {
  const pos = wallNode.position;
  const length = wallNode.data?.length || wallNode.style?.width || 0;
  const height = wallNode.style?.height || wallNode.data?.thickness || 15;
  const rotation = (wallNode.data?.rotation || 0) * Math.PI / 180;

  // Assuming pos.x, pos.y is the top-left of the wall's bounding box
  // The centerline starts at (pos.x, pos.y + height / 2)
  const x1 = pos.x;
  const y1 = pos.y + height / 2;
  const x2 = pos.x + length * Math.cos(rotation);
  const y2 = pos.y + height / 2 + length * Math.sin(rotation);

  return [{ x: x1, y: y1 }, { x: x2, y: y2 }];
};

// Vérifie si deux points sont connectés (proches)
const arePointsConnected = (p1, p2, tolerance = 5) => {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y) <= tolerance;
};

// Fonction pour récupérer TOUS les murs connectés à un point donné
const getConnectedWalls = (point, nodes, excludeWallId) => {
    return nodes.filter(node => {
        if (node.type !== 'wall' || node.id === excludeWallId || node.id === 'wall_preview') return false;
        const [A, B] = getWallEndpoints(node);
        return arePointsConnected(A, point) || arePointsConnected(B, point);
    });
};

const cleanupWalls = (nodes) => {
    let cleanNodes = [...nodes];
    const toleranceDist = 5;
    const toleranceAngle = 2; 
    
    let hasMerged = true;
    while(hasMerged) {
        hasMerged = false;
        for (let i = 0; i < cleanNodes.length; i++) {
            if (cleanNodes[i].type !== 'wall') continue;
            for (let j = i + 1; j < cleanNodes.length; j++) {
                 if (cleanNodes[j].type !== 'wall') continue;
                 
                 const n1 = cleanNodes[i];
                 const n2 = cleanNodes[j];
                 
                 const [A1, B1] = getWallEndpoints(n1);
                 const [A2, B2] = getWallEndpoints(n2);
                 
                 let a1 = (n1.data?.rotation || 0) % 180;
                 if (a1 < 0) a1 += 180;
                 let a2 = (n2.data?.rotation || 0) % 180;
                 if (a2 < 0) a2 += 180;
                 
                 const angleDiff = Math.min(Math.abs(a1 - a2), Math.abs(180 - Math.abs(a1 - a2)));
                 
                 if (angleDiff < toleranceAngle) {
                     let merge = false;
                     let startP, endP;
                     
                     if (Math.hypot(A1.x - A2.x, A1.y - A2.y) < toleranceDist) { merge = true; startP = B1; endP = B2; }
                     else if (Math.hypot(B1.x - B2.x, B1.y - B2.y) < toleranceDist) { merge = true; startP = A1; endP = A2; }
                     else if (Math.hypot(A1.x - B2.x, A1.y - B2.y) < toleranceDist) { merge = true; startP = B1; endP = A2; }
                     else if (Math.hypot(B1.x - A2.x, B1.y - A2.y) < toleranceDist) { merge = true; startP = A1; endP = B2; }
                     
                     if (merge) {
                         const distance = Math.hypot(endP.x - startP.x, endP.y - startP.y);
                         const angle = Math.atan2(endP.y - startP.y, endP.x - startP.x) * (180 / Math.PI);
                         
                         const newWall = {
                            id: n1.id, 
                            type: 'wall',
                            position: { x: startP.x, y: startP.y - (n1.data?.thickness || 15) / 2 },
                            data: { ...n1.data, rotation: angle, length: Math.round(distance), thickness: n1.data?.thickness || 15 },
                            style: { ...n1.style, width: distance },
                         };
                         
                         cleanNodes.splice(j, 1);
                         cleanNodes[i] = newWall;
                         hasMerged = true;
                         break; 
                     }
                 }
            }
            if (hasMerged) break;
        }
    }
    return cleanNodes;
};

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
    if (Math.abs((distA + distB) - distAB) < 1.0) {
      hasSplit = true;

      const angle1 = Math.atan2(point.y - A.y, point.x - A.x) * (180 / Math.PI);
      newSplitWalls.push({
        ...node,
        id: getIdFunc(),
        position: { x: A.x, y: A.y - (node.style?.height || node.data?.thickness || 15) / 2 },
        data: { ...node.data, rotation: angle1, length: Math.round(distA) },
        style: { ...node.style, width: distA },
      });

      const angle2 = Math.atan2(B.y - point.y, B.x - point.x) * (180 / Math.PI);
      newSplitWalls.push({
        ...node,
        id: getIdFunc(),
        position: { x: point.x, y: point.y - (node.style?.height || node.data?.thickness || 15) / 2 },
        data: { ...node.data, rotation: angle2, length: Math.round(distB) },
        style: { ...node.style, width: distB },
      });
    } else {
      nodesToKeep.push(node);
    }
  });

  return hasSplit ? [...nodesToKeep, ...newSplitWalls] : nodes;
};

export const useWallDrawer = ({ isDrawingWall, setIsDrawingWall, nodes, setNodes, takeSnapshot, reactFlowWrapper, setErrorMessage, texts, isWallLinkingEnabled = true }) => {
  const [wallStartPoint, setWallStartPoint] = useState(null);
  const [currentPath, setCurrentPath] = useState([]);
  
  const [resizingWallId, setResizingWallId] = useState(null);
  const [resizeHandle, setResizeHandle] = useState(null); // 'start' ou 'end'
  const [fixedPoint, setFixedPoint] = useState(null);
  
  const [linkedWallIds, setLinkedWallIds] = useState([]);
  const [linkedWallsAnchors, setLinkedWallsAnchors] = useState({});

  const { screenToFlowPosition, setCenter, getZoom } = useReactFlow();
  const store = useStoreApi(); 

  const SNAP_RADIUS = 20;

  const cancelDrawing = useCallback(() => {
    setIsDrawingWall(false);
    setWallStartPoint(null);
    setCurrentPath([]);
    setNodes((nds) => {
        return nds.filter((n) => n.id !== 'wall_preview');
    });
    setResizingWallId(null);
    setLinkedWallIds([]);
    setLinkedWallsAnchors({});
    if(setErrorMessage) setErrorMessage(null); 
  }, [setIsDrawingWall, setNodes, setErrorMessage]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && (isDrawingWall || resizingWallId)) cancelDrawing();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawingWall, resizingWallId, cancelDrawing]);

  // ON MOUSE DOWN POUR LE REDIMENSIONNEMENT (Event Custom venant de WallNode)
  useEffect(() => {
    const handleStartResize = (e) => {
      const { nodeId, handleType } = e.detail;
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        if (takeSnapshot) takeSnapshot();
        const [A, B] = getWallEndpoints(node);

        let movingPoint;
        if (handleType === 'start') {
          setResizeHandle('start');
          setFixedPoint(B);
          movingPoint = A;
        } else {
          setResizeHandle('end');
          setFixedPoint(A);
          movingPoint = B;
        }

        setResizingWallId(nodeId);

        // Au moment du clic, on fige la liste des murs qui étaient attachés à ce point ET leur point fixe (l'autre bout)
        if (isWallLinkingEnabled) {
            const connected = getConnectedWalls(movingPoint, nodes, nodeId);
            const anchors = {};

            connected.forEach(connectedNode => {
                const [cA, cB] = getWallEndpoints(connectedNode);
                if (arePointsConnected(cA, movingPoint)) {
                    anchors[connectedNode.id] = cB;
                } else {
                    anchors[connectedNode.id] = cA;
                }
            });

            setLinkedWallIds(connected.map(n => n.id));
            setLinkedWallsAnchors(anchors);
        } else {
            setLinkedWallIds([]);
            setLinkedWallsAnchors({});
        }
      }
    };
    window.addEventListener('startWallResize', handleStartResize);
    return () => window.removeEventListener('startWallResize', handleStartResize);
  }, [nodes, takeSnapshot, isWallLinkingEnabled]);


  const getPoint = useCallback((rawPos, ignoreWallId = null) => {
    let point = {
      x: Math.round(rawPos.x / SNAP_GRID) * SNAP_GRID,
      y: Math.round(rawPos.y / SNAP_GRID) * SNAP_GRID
    };

    let minDistance = SNAP_RADIUS;
    let bestSnapPoint = null;

    nodes.forEach(node => {
      if (node.type === 'wall' && node.id !== 'wall_preview' && node.id !== ignoreWallId) {
        const [A, B] = getWallEndpoints(node);

        [A, B].forEach(ep => {
          const dist = Math.hypot(rawPos.x - ep.x, rawPos.y - ep.y);
          if (dist < minDistance) {
            minDistance = dist;
            bestSnapPoint = { x: ep.x, y: ep.y };
          }
        });

        const l2 = Math.pow(A.x - B.x, 2) + Math.pow(A.y - B.y, 2);
        if (l2 !== 0) {
          let t = ((rawPos.x - A.x) * (B.x - A.x) + (rawPos.y - A.y) * (B.y - A.y)) / l2;
          t = Math.max(0, Math.min(1, t));
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


  const onPaneClick = useCallback((event) => {
      if (resizingWallId) return;

      if (!isDrawingWall) return;

      if (setErrorMessage) setErrorMessage(null);

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

          if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
              if (setErrorMessage) setErrorMessage(texts?.wall_too_short || "Le mur est trop court (clic au même endroit).");
              return;
          }

          if (isShiftPressed) {
              if (Math.abs(dx) > Math.abs(dy)) endPoint = { x: currentPoint.x, y: wallStartPoint.y };
              else endPoint = { x: wallStartPoint.x, y: currentPoint.y };
          }

          if (takeSnapshot) takeSnapshot();

          const startOfPath = currentPath[0];
          const distToStart = Math.hypot(endPoint.x - startOfPath.x, endPoint.y - startOfPath.y);

          let isClosingPath = currentPath.length >= 2 && distToStart < SNAP_RADIUS;
          let isClosingExistingWall = false;
          let existingWallPoint = null;

          if (!isClosingPath) {
              nodes.forEach(node => {
                  if (node.type === 'wall' && node.id !== 'wall_preview') {
                      const [A, B] = getWallEndpoints(node);
                      if (Math.hypot(endPoint.x - A.x, endPoint.y - A.y) < SNAP_RADIUS) {
                          isClosingExistingWall = true;
                          existingWallPoint = A;
                      } else if (Math.hypot(endPoint.x - B.x, endPoint.y - B.y) < SNAP_RADIUS) {
                          isClosingExistingWall = true;
                          existingWallPoint = B;
                      }
                  }
              });
          }

          const isClosing = isClosingPath || isClosingExistingWall;
          let finalEndPoint = endPoint;

          if (isClosing) {
              finalEndPoint = isClosingPath ? startOfPath : existingWallPoint;
              if (isShiftPressed) {
                 const fdx = finalEndPoint.x - wallStartPoint.x;
                 const fdy = finalEndPoint.y - wallStartPoint.y;
                 if (Math.abs(fdx) > Math.abs(fdy)) finalEndPoint = { x: finalEndPoint.x, y: wallStartPoint.y };
                 else finalEndPoint = { x: wallStartPoint.x, y: finalEndPoint.y };
              }
          }

          const distance = Math.hypot(finalEndPoint.x - wallStartPoint.x, finalEndPoint.y - wallStartPoint.y);
          const angle = Math.atan2(finalEndPoint.y - wallStartPoint.y, finalEndPoint.x - wallStartPoint.x) * (180 / Math.PI);

          const newWall = {
              id: getId(),
              type: 'wall',
              position: { x: wallStartPoint.x, y: wallStartPoint.y - 7.5 },
              data: { label: '', rotation: angle, length: Math.round(distance), thickness: 15 },
              style: { width: distance, height: 15 },
          };

          let currentNodes = nodes;

          if (isClosing) {
              currentNodes = splitWallsIfNeeded(wallStartPoint, currentNodes, getId);
              currentNodes = splitWallsIfNeeded(finalEndPoint, currentNodes, getId);
              currentNodes = cleanupWalls(currentNodes);
              currentNodes = currentNodes.filter(n => n.id !== 'wall_preview').concat(newWall);

              setNodes(currentNodes);
              setIsDrawingWall(false);
              setWallStartPoint(null);
              setCurrentPath([]);
          } else {
              currentNodes = splitWallsIfNeeded(wallStartPoint, currentNodes, getId);
              currentNodes = splitWallsIfNeeded(finalEndPoint, currentNodes, getId);
              currentNodes = cleanupWalls(currentNodes);
              currentNodes = currentNodes.filter(n => n.id !== 'wall_preview').concat(newWall);

              setNodes(currentNodes);
              setWallStartPoint(finalEndPoint);
              setCurrentPath(prev => [...prev, finalEndPoint]);
          }
      }
  }, [isDrawingWall, getPoint, wallStartPoint, currentPath, nodes, setErrorMessage, texts, takeSnapshot, setNodes, setIsDrawingWall, screenToFlowPosition, resizingWallId]);

  // ON RAJOUTE LE PREVIEW DANS LE HOOK !
  const handlePaneMouseMoveNativeLogic = useCallback((event) => {
    if (!isDrawingWall || !wallStartPoint || resizingWallId) return;

    const rawPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    let currentPoint = getPoint(rawPos);

    setNodes(nds => {
      const dx = currentPoint.x - wallStartPoint.x;
      const dy = currentPoint.y - wallStartPoint.y;
      const distance = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      const thickness = 15;

      const existingWall = nds.find(n => n.id === 'wall_preview');

      if (existingWall) {
        return nds.map(n => n.id === 'wall_preview' ? {
          ...n,
          data: { ...n.data, rotation: angle, length: Math.round(distance), thickness: existingWall.data?.thickness || thickness },
          position: { x: wallStartPoint.x, y: wallStartPoint.y - (existingWall.data?.thickness || thickness) / 2 },
          style: { ...n.style, width: distance }
        } : n);
      } else {
        return [...nds, {
          id: 'wall_preview',
          type: 'wall',
          position: { x: wallStartPoint.x, y: wallStartPoint.y - (thickness / 2) },
          data: { label: '', rotation: angle, length: Math.round(distance), thickness },
          style: { width: distance, height: thickness, backgroundColor: 'transparent' },
        }];
      }
    });
  }, [isDrawingWall, wallStartPoint, screenToFlowPosition, getPoint, setNodes, resizingWallId]);

  const handlePaneMouseMoveLogic = useCallback((event) => {

    // --- Auto-pan robuste via le store ---
    if (reactFlowWrapper?.current && (isDrawingWall || resizingWallId)) {
        const bounds = reactFlowWrapper.current.getBoundingClientRect();
        const margin = 70;
        const zoom = getZoom() || 1;
        const speed = 15 / zoom; 
        
        let dx = 0;
        let dy = 0;

        if (event.clientX < bounds.left + margin) dx = -speed;
        else if (event.clientX > bounds.right - margin) dx = speed;

        if (event.clientY < bounds.top + margin) dy = -speed;
        else if (event.clientY > bounds.bottom - margin) dy = speed;

        if (dx !== 0 || dy !== 0) {
            const { transform } = store.getState();
            const viewX = -transform[0] / transform[2];
            const viewY = -transform[1] / transform[2];
            const viewW = bounds.width / transform[2];
            const viewH = bounds.height / transform[2];
            
            const currentCenterX = viewX + viewW / 2;
            const currentCenterY = viewY + viewH / 2;
            
            setCenter(currentCenterX + dx, currentCenterY + dy, { duration: 0 });
        }
    }

    const rawPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });

    // 1. Redimensionnement manuel ET lié
    if (resizingWallId && fixedPoint) {
      let currentPoint = getPoint(rawPos, resizingWallId);

      setNodes(nds => {
          let updatedNodes = nds.map(node => {
              if (node.id === resizingWallId) {
                  let p1 = resizeHandle === 'start' ? currentPoint : fixedPoint;
                  let p2 = resizeHandle === 'end' ? currentPoint : fixedPoint;

                  const dx = p2.x - p1.x;
                  const dy = p2.y - p1.y;
                  const distance = Math.hypot(dx, dy);
                  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

                  return {
                      ...node,
                      position: { x: p1.x, y: p1.y - (node.style?.height || node.data?.thickness || 15) / 2 },
                      data: { ...node.data, rotation: angle, length: Math.round(distance) },
                      style: { ...node.style, width: distance }
                  };
              }

              if (isWallLinkingEnabled && linkedWallIds.includes(node.id)) {
                  let anchorPoint = linkedWallsAnchors[node.id];

                  if (anchorPoint) {
                      const distance = Math.hypot(currentPoint.x - anchorPoint.x, currentPoint.y - anchorPoint.y);
                      const angle = Math.atan2(currentPoint.y - anchorPoint.y, currentPoint.x - anchorPoint.x) * (180 / Math.PI);

                      return {
                          ...node,
                          position: { x: anchorPoint.x, y: anchorPoint.y - (node.style?.height || node.data?.thickness || 15) / 2 },
                          data: { ...node.data, rotation: angle, length: Math.round(distance) },
                          style: { ...node.style, width: distance }
                      };
                  }
              }

              return node;
          });

          return updatedNodes;
      });
    }

  }, [isDrawingWall, getPoint, setNodes, resizingWallId, fixedPoint, resizeHandle, store, setCenter, getZoom, reactFlowWrapper, isWallLinkingEnabled, linkedWallIds, linkedWallsAnchors, screenToFlowPosition]);

  const onPaneContextMenu = useCallback((event) => {
    if (isDrawingWall) {
      event.preventDefault();
      cancelDrawing();
    }
  }, [isDrawingWall, cancelDrawing]);

  // Fin du redimensionnement GLOBAL
  const endResize = useCallback(() => {
    if (resizingWallId) {
        let nodeToUpdate = null;
        let finalNodes = nodes.map(n => {
            if (n.id === resizingWallId) {
                nodeToUpdate = n;
            }
            return n;
        });

        if (nodeToUpdate) {
            const [A, B] = getWallEndpoints(nodeToUpdate);
            finalNodes = finalNodes.filter(n => n.id !== resizingWallId);

            finalNodes = splitWallsIfNeeded(A, finalNodes, getId);
            finalNodes = splitWallsIfNeeded(B, finalNodes, getId);

            finalNodes = cleanupWalls(finalNodes);
            finalNodes.push(nodeToUpdate);
            
            setNodes(finalNodes);
        }

        setResizingWallId(null);
        setFixedPoint(null);
        setResizeHandle(null);
        setLinkedWallIds([]);
        setLinkedWallsAnchors({});
    }
  }, [resizingWallId, nodes, setNodes]);

  useEffect(() => {
    window.addEventListener('mouseup', endResize);
    return () => window.removeEventListener('mouseup', endResize);
  }, [endResize]);


  // Fonction pour commencer un mur depuis un mur existant
  const onNodeClick = useCallback((e, n) => {
      if (isDrawingWall && !wallStartPoint && n.type === 'wall' && n.id !== 'wall_preview') {
          const rawPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
          const point = getPoint(rawPos);
          setWallStartPoint(point);
          setCurrentPath([point]);
          e.stopPropagation();
      }
  }, [isDrawingWall, wallStartPoint, screenToFlowPosition, getPoint]);


  // Empêche le drag global du noeud
  const onNodeDragStart = useCallback((event, node) => {
    if (node.type === 'wall') {
        event.preventDefault();
    }
  }, []);

  return { 
    onPaneClick,
    onPaneMouseMove: (e) => {
        handlePaneMouseMoveNativeLogic(e);
        handlePaneMouseMoveLogic(e);
    },
    onPaneContextMenu,
    onNodeClick,
    onNodeDragStart
  };
};