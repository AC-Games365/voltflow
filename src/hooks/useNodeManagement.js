import { useCallback } from 'react';
import { useReactFlow, applyNodeChanges, addEdge, MarkerType } from 'reactflow';

const getId = () => `dndnode_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

export const useNodeManagement = ({ setNodes, setEdges, takeSnapshot, selectedNodes, selectedNode, selectedEdge }) => {
  const { screenToFlowPosition } = useReactFlow();

  const onNodesChange = useCallback((changes) => {
    const shouldSnapshot = changes.some(c => c.type === 'remove' || (c.type === 'position' && !c.dragging));
    if (shouldSnapshot) takeSnapshot();
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, [takeSnapshot, setNodes]);

  const onConnect = useCallback((params) => {
    takeSnapshot();
    setEdges((eds) => addEdge({ ...params, type: 'smoothstep', label: '3G2.5' }, eds));
  }, [setEdges, takeSnapshot]);

  const onDrop = useCallback((event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    if (!type) return;
    
    takeSnapshot();
    
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const newNode = {
      id: getId(), type, position,
      data: { label: event.dataTransfer.getData('application/reactflow-label') || type },
    };
    setNodes((nds) => nds.concat(newNode));
  }, [screenToFlowPosition, setNodes, takeSnapshot]);

  const updateNodeData = useCallback((key, value) => {
    takeSnapshot();
    setNodes((nds) => nds.map((node) => {
      if (node.selected) return { ...node, data: { ...node.data, [key]: value } };
      return node;
    }));
  }, [setNodes, takeSnapshot]);

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
        ...node,
        id: getId(),
        parentId: undefined,
        selected: true,
        position: { x: node.position.x + 30, y: node.position.y + 30 },
      }));

      const unselected = nds.map((n) => ({ ...n, selected: false }));
      return [...unselected, ...newNodes];
    });
  }, [takeSnapshot, setNodes]);

  return { onNodesChange, onConnect, onDrop, updateNodeData, updateNodeProperty, updateNodeStyle, updateEdgeLabel, updateEdgeColor, updateEdgeArrow, updateEdgeType, onGroup, onUngroup, onDuplicate };
};