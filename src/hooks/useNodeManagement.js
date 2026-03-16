import { useCallback } from 'react';
import { useReactFlow, applyNodeChanges, addEdge, MarkerType } from 'reactflow';

const getId = () => `node_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

export const useNodeManagement = ({ nodes, levels, setNodes, setEdges, takeSnapshot, selectedNodes, selectedNode, selectedEdge, activeCircuit, setActiveCircuit, setState }) => {
  const { screenToFlowPosition } = useReactFlow();

  // --- LOGIQUE D'AIMANTATION (SMART SNAPPING) ---
  const getSnappedPosition = useCallback((pos, type, currentRotation) => {
    const SNAP_THRESHOLD = 30; 
    let snappedPos = { ...pos };
    let rotation = currentRotation || 0;
    let isSnapped = false;

    // Seuls les éléments liés aux murs s'aimantent
    const snappableTypes = ['socket', 'socket_double', 'socket_triple', 'switch', 'wall_light', 'door', 'window', 'rj45', 'thermostat', 'camera'];
    if (!snappableTypes.includes(type)) return { pos, rotation, isSnapped, wallThickness: null };

    let bestWallThickness = null;

    nodes.forEach(wall => {
      if (wall.type !== 'wall') return;

      const wX = wall.position.x;
      const wY = wall.position.y;
      
      // On récupère la longueur et l'épaisseur, en tenant compte de la rotation
      const wLength = wall.data?.length || wall.style?.width || 0;
      const wThickness = wall.data?.thickness || wall.style?.height || 15;
      const wRot = wall.data?.rotation || 0;
      
      // Pour l'aimantation, on doit calculer la position du point sur le segment du mur
      // 1. Conversion de la position de la souris dans le repère local du mur
      const dx = pos.x - wX;
      const dy = pos.y - wY;
      
      const rad = wRot * Math.PI / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      
      const localX = dx * cos + dy * sin;
      const localY = -dx * sin + dy * cos;
      
      // Si on est à peu près sur la longueur du mur, et proche de son centre (épaisseur)
      if (localX >= 0 && localX <= wLength && Math.abs(localY) < SNAP_THRESHOLD) {
          
          // On "cloue" l'élément sur l'axe central du mur
          // On ramène localY à 0, et on re-projette dans l'espace global
          const newDx = localX * cos;
          const newDy = localX * sin;
          
          snappedPos.x = wX + newDx;
          snappedPos.y = wY + newDy;
          
          // La rotation s'adapte au mur
          rotation = wRot;
          isSnapped = true;
          bestWallThickness = wThickness;
      }
    });

    return { pos: snappedPos, rotation, isSnapped, wallThickness: bestWallThickness };
  }, [nodes]);

  const onNodesChange = useCallback((changes) => {
    const isRemoval = changes.some(c => c.type === 'remove');
    const isDragStop = changes.some(c => c.type === 'position' && !c.dragging);
    
    if (isRemoval || isDragStop) takeSnapshot();

    if (isRemoval) {
      setState(cs => {
        const activeLevel = cs.levels.find(l => l.id === cs.activeLevelId);
        const nextActiveNodes = applyNodeChanges(changes, activeLevel.nodes);
        const removedNodes = activeLevel.nodes.filter(n => changes.some(c => c.type === 'remove' && c.id === n.id));
        const affectedLetters = new Set(removedNodes.map(n => n.data?.circuit?.match(/^[A-Z]+/)?.[0]).filter(Boolean));
        const intermediateLevels = cs.levels.map(l => l.id === cs.activeLevelId ? { ...l, nodes: nextActiveNodes } : l);

        if (affectedLetters.size > 0) {
          return { ...cs, levels: intermediateLevels };
        }
        return { ...cs, levels: intermediateLevels };
      });
    } else {
      setNodes((nds) => {
          // Pendant le drag, on peut forcer l'aimantation en temps réel !
          const positionChanges = changes.filter(c => c.type === 'position' && c.position);
          
          if (positionChanges.length > 0) {
              return nds.map(node => {
                  const change = positionChanges.find(c => c.id === node.id);
                  if (change && change.position) { // FIX: S'assurer que position existe bien
                      // Si c'est un noeud "snappable", on calcule le snap
                      const { pos, rotation, isSnapped, wallThickness } = getSnappedPosition(change.position, node.type, node.data?.rotation);
                      
                      if (isSnapped) {
                          return { 
                              ...node, 
                              position: pos, 
                              data: { ...node.data, rotation },
                              // Si c'est une porte ou une fenêtre, on ajuste son épaisseur (hauteur de style) sur le mur
                              style: (node.type === 'door' || node.type === 'window') ? { ...node.style, height: wallThickness } : node.style
                          };
                      }
                  }
                  // S'il y a un changement pour ce noeud, on l'applique (en vérifiant bien qu'on passe un tableau valide)
                  return change ? applyNodeChanges([change], [node])[0] : node;
              });
          }
          return applyNodeChanges(changes, nds);
      });
    }
  }, [takeSnapshot, setNodes, setState, getSnappedPosition]);

  const onNodeDragStop = useCallback((event, node) => {
    if(!node || !node.position) return; // FIX: S'assurer que le node a une position
    // Le snap est déjà géré en temps réel par onNodesChange, mais on double-vérifie ici à la fin
    const { pos, rotation, isSnapped, wallThickness } = getSnappedPosition(node.position, node.type, node.data?.rotation);
    if (isSnapped) {
      takeSnapshot();
      setNodes(nds => nds.map(n => n.id === node.id ? { 
          ...n, 
          position: pos, 
          data: { ...n.data, rotation },
          style: (n.type === 'door' || n.type === 'window') ? { ...n.style, height: wallThickness } : n.style
      } : n));
    }
  }, [getSnappedPosition, setNodes, takeSnapshot]);

  const onDrop = useCallback((event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    if (!type) return;
    
    takeSnapshot();
    const rawPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    
    // Application de l'aimantation au drop
    const { pos, rotation, wallThickness } = getSnappedPosition(rawPos, type, 0);

    const baseLetter = activeCircuit || 'A';
    let maxNum = 0;
    levels.forEach(level => {
      level.nodes.forEach(n => {
        if (n.data?.circuit?.startsWith(baseLetter)) {
          const num = parseInt(n.data.circuit.replace(baseLetter, ''), 10);
          if (num > maxNum) maxNum = num;
        }
      });
    });
    
    const newNode = {
      id: getId(), type, position: pos,
      data: { 
        label: event.dataTransfer.getData('application/reactflow-label') || type,
        circuit: `${baseLetter}${maxNum + 1}`,
        rotation: rotation
      },
      style: (type === 'door' || type === 'window') ? { width: 80, height: wallThickness || 15 } : {}
    };

    setNodes((nds) => nds.concat(newNode));
  }, [screenToFlowPosition, levels, setNodes, takeSnapshot, activeCircuit, getSnappedPosition]);

  const onConnect = useCallback((params) => {
    takeSnapshot();
    setEdges((eds) => addEdge({ ...params, type: 'smoothstep', label: '3G2.5' }, eds));
  }, [setEdges, takeSnapshot]);

  const updateNodeData = useCallback((key, value) => {
    takeSnapshot();
    if (key === 'circuit') {
      const main = value.match(/^[A-Z]+/)?.[0];
      if (main) setActiveCircuit(main);
    }
    setNodes((nds) => nds.map((node) => {
      if (node.selected) return { ...node, data: { ...node.data, [key]: value } };
      return node;
    }));
  }, [setNodes, takeSnapshot, setActiveCircuit]);

  const updateNodeProperty = useCallback((key, value) => {
    takeSnapshot();
    setNodes((nds) => nds.map((node) => {
      if (node.id === selectedNode?.id) return { ...node, [key]: value };
      return node;
    }));
  }, [selectedNode, setNodes, takeSnapshot]);

  const updateNodeStyle = useCallback((key, value) => {
    takeSnapshot();
    setNodes((nds) => nds.map((node) => {
      if (node.id === selectedNode?.id) return { ...node, style: { ...node.style, [key]: Math.max(1, value) } };
      return node;
    }));
  }, [selectedNode, setNodes, takeSnapshot]);

  const updateEdgeLabel = useCallback((value) => {
    takeSnapshot();
    setEdges((eds) => eds.map((edge) => {
      if (edge.id === selectedEdge?.id) return { ...edge, label: value };
      return edge;
    }));
  }, [selectedEdge, setEdges, takeSnapshot]);

  const updateEdgeColor = useCallback((color) => {
    takeSnapshot();
    setEdges((eds) => eds.map((edge) => {
      if (edge.id === selectedEdge?.id) {
        const updatedEdge = { ...edge, style: { ...edge?.style, stroke: color } };
        if (updatedEdge.markerEnd) updatedEdge.markerEnd = { ...updatedEdge.markerEnd, color: color };
        return updatedEdge;
      }
      return edge;
    }));
  }, [selectedEdge, setEdges, takeSnapshot]);

  const updateEdgeArrow = useCallback((hasArrow) => {
    takeSnapshot();
    setEdges((eds) => eds.map((edge) => {
      if (edge.id === selectedEdge?.id) {
        if (hasArrow) return { ...edge, markerEnd: { type: MarkerType.ArrowClosed, color: edge.style?.stroke || '#b1b1b7' } };
        const { markerEnd, ...rest } = edge;
        return rest;
      }
      return edge;
    }));
  }, [selectedEdge, setEdges, takeSnapshot]);

  const updateEdgeType = useCallback((type) => {
    takeSnapshot();
    setEdges((eds) => eds.map((edge) => {
      if (edge.id === selectedEdge?.id) return { ...edge, type: type };
      return edge;
    }));
  }, [selectedEdge, setEdges, takeSnapshot]);

  const onGroup = useCallback(() => {
    if (selectedNodes.length < 2) return;
    takeSnapshot();
    const minX = Math.min(...selectedNodes.map(n => n.position.x));
    const minY = Math.min(...selectedNodes.map(n => n.position.y));
    const maxX = Math.max(...selectedNodes.map(n => n.position.x + (n.style?.width || 50)));
    const maxY = Math.max(...selectedNodes.map(n => n.position.y + (n.style?.height || 50)));
    const padding = 20;
    const groupId = getId();
    const groupNode = {
      id: groupId, type: 'group', position: { x: minX - padding, y: minY - padding },
      style: { width: maxX - minX + padding * 2, height: maxY - minY + padding * 2, backgroundColor: 'rgba(0, 130, 255, 0.05)', border: '2px dashed rgba(0, 130, 255, 0.4)', borderRadius: '8px', zIndex: -1 },
      data: { label: '' }
    };
    setNodes(nds => {
      const newNodes = nds.map(n => {
        if (n.selected && n.id !== groupId) {
          return { ...n, parentId: groupId, position: { x: n.position.x - groupNode.position.x, y: n.position.y - groupNode.position.y }, selected: false };
        }
        return n;
      });
      return [...newNodes, groupNode].map(n => n.id === groupId ? { ...n, selected: true } : n);
    });
  }, [selectedNodes, takeSnapshot, setNodes]);

  const onUngroup = useCallback(() => {
    if (!selectedNode || selectedNode.type !== 'group') return;
    takeSnapshot();
    setNodes(nds => {
      const children = nds.filter(n => n.parentId === selectedNode.id);
      const others = nds.filter(n => n.parentId !== selectedNode.id && n.id !== selectedNode.id);
      const freedChildren = children.map(c => ({ ...c, parentId: undefined, position: { x: c.position.x + selectedNode.position.x, y: c.position.y + selectedNode.position.y }, selected: true }));
      return [...others, ...freedChildren];
    });
  }, [selectedNode, takeSnapshot, setNodes]);

  const onDuplicate = useCallback(() => {
    takeSnapshot();
    setNodes((nds) => {
      const currentlySelected = nds.filter((n) => n.selected);
      if (currentlySelected.length === 0) return nds;
      const newNodes = currentlySelected.map((node) => ({
        ...node, id: getId(), parentId: undefined, selected: true,
        position: { x: node.position.x + 30, y: node.position.y + 30 },
      }));
      const unselected = nds.map((n) => ({ ...n, selected: false }));
      return [...unselected, ...newNodes];
    });
  }, [takeSnapshot, setNodes]);

  return { onNodesChange, onNodeDragStop, onConnect, onDrop, updateNodeData, updateNodeProperty, updateNodeStyle, updateEdgeLabel, updateEdgeColor, updateEdgeArrow, updateEdgeType, onGroup, onUngroup, onDuplicate };
};