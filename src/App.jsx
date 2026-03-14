import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import ReactFlow, { 
  ReactFlowProvider,
  Background, 
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  Panel,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import Sidebar from './Sidebar.jsx';
import LightNode from './LightNode.jsx';
import SocketNode from './SocketNode.jsx';
import DoubleSocketNode from './DoubleSocketNode.jsx';
import TripleSocketNode from './TripleSocketNode.jsx';
import WallNode from './WallNode.jsx';
import RoomNode from './RoomNode.jsx';
import DoorNode from './DoorNode.jsx';
import WindowNode from './WindowNode.jsx';
import PanelNode from './PanelNode.jsx';
import BreakerNode from './BreakerNode.jsx';
import SwitchNode from './SwitchNode.jsx';
import JunctionBoxNode from './JunctionBoxNode.jsx';
import SpotLightNode from './SpotLightNode.jsx';
import WallLightNode from './WallLightNode.jsx';
import TextNode from './TextNode.jsx';
import ImageNode from './ImageNode.jsx';
import Rj45Node from './Rj45Node.jsx';
import ThermostatNode from './ThermostatNode.jsx';
import { t } from './translations.js';
import { toPng } from 'html-to-image';

// On associe un nom de type à nos composants personnalisés
const nodeTypes = {
  light: LightNode,
  socket: SocketNode,
  socket_double: DoubleSocketNode,
  socket_triple: TripleSocketNode,
  wall: WallNode,
  room: RoomNode,
  door: DoorNode,
  window: WindowNode,
  panel: PanelNode,
  breaker: BreakerNode,
  switch: SwitchNode,
  junction_box: JunctionBoxNode,
  spotlight: SpotLightNode,
  wall_light: WallLightNode,
  text: TextNode,
  image: ImageNode,
  rj45: Rj45Node,
  thermostat: ThermostatNode,
};

// On définit nos composants électriques de base
const initialNodes = [
  { 
    id: '1', 
    type: 'light',
    position: { x: 100, y: 100 }, 
    data: { label: '💡 Ampoule Salon', circuit: 'A' },
  },
  { 
    id: '2', 
    type: 'socket',
    position: { x: 100, y: 250 }, 
    data: { label: '🔌 Prise Murale', rotation: 0, circuit: 'A' },
  },
];

// On définit le fil qui les relie
const initialEdges = [{ 
  id: 'e1-2', 
  source: '2', 
  target: '1', 
  type: 'smoothstep', 
  animated: true,
  label: '3G2.5',
  labelStyle: { fill: '#333', fontWeight: 700 },
  labelBgStyle: { fill: '#f0f0f0' }
}];

// Nouvel ID basé sur le temps pour éviter tout conflit entre les sauvegardes
const getId = () => `dndnode_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

const initialProjectData = {
  projectName: '',
  clientName: '',
  clientAddress: '',
  installerName: '',
  date: new Date().toISOString().split('T')[0], // Date du jour par défaut
  showCartouche: true,
  showDimensions: true,
  showLegend: true,
  canvasBgColor: '#f0f0f0'
};

const getSavedPlan = () => {
  const saved = localStorage.getItem('voltflow-plan');
  if (saved) {
    try { 
      const parsed = JSON.parse(saved);
      return { nodes: parsed.nodes || initialNodes, edges: parsed.edges || initialEdges, projectData: parsed.projectData || initialProjectData };
    } catch (e) {}
  }
  return { nodes: initialNodes, edges: initialEdges, projectData: initialProjectData };
};

function Editor() {
  const reactFlowWrapper = useRef(null);
  const [lang, setLang] = useState('fr');
  const texts = t[lang];
  const [isDrawingWall, setIsDrawingWall] = useState(false);
  const [wallStartPoint, setWallStartPoint] = useState(null);
  const [currentPath, setCurrentPath] = useState([]); // Mémorise le chemin pour détecter une pièce

  const initialPlan = useMemo(() => getSavedPlan(), []);
  
  const [projectData, setProjectData] = useState(initialPlan.projectData);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(true);
  
  const [viewMode, setViewMode] = useState('plan'); // 'plan' ou 'unifilaire'
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);

  // Utilisation des hooks de React Flow pour rendre le graphe éditable
  const [nodes, setNodes, onNodesChange] = useNodesState(initialPlan.nodes || initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialPlan.edges || initialEdges);
  const { screenToFlowPosition, fitView } = useReactFlow();

  // Gestion des sélections (multiples ou uniques)
  const selectedNodes = nodes.filter((node) => node.selected);
  const selectedNode = selectedNodes.length === 1 ? selectedNodes[0] : null;
  
  const selectedEdges = edges.filter((edge) => edge.selected);
  const selectedEdge = selectedEdges.length === 1 ? selectedEdges[0] : null;

  // Calcul de la liste du matériel (nomenclature)
  const materialCounts = useMemo(() => {
    const counts = {};
    const electricalTypes = ['light', 'spotlight', 'wall_light', 'socket', 'socket_double', 'socket_triple', 'switch', 'junction_box', 'breaker', 'panel', 'rj45', 'thermostat'];
    nodes.forEach(node => {
      if (electricalTypes.includes(node.type)) {
        counts[node.type] = (counts[node.type] || 0) + 1;
      }
    });
    return counts;
  }, [nodes]);


  const generateUnifilaire = useCallback(() => {


  // Algorithme de génération du Schéma Unifilaire
  const { uNodes, uEdges } = useMemo(() => {
    if (viewMode !== 'unifilaire') return { uNodes: [], uEdges: [] };

    const uNodes = [];
    const uEdges = [];
    const circuits = {};

    // Regroupement des composants par Circuit
    nodes.forEach(n => {
      if (n.data?.circuit) {
        const c = n.data.circuit;
        if (!circuits[c]) circuits[c] = { components: [], breaker: null };
        if (n.type === 'breaker') circuits[c].breaker = n;
        else circuits[c].components.push(n);
      }
    });

    const circuitKeys = Object.keys(circuits).sort();
    
    // Si aucun circuit n'est défini
    if (circuitKeys.length === 0) {
      uNodes.push({ id: 'empty', type: 'text', position: { x: 200, y: 200 }, data: { label: texts.no_circuit, fontSize: 24, color: '#dc3545' } });
      uNodes.push({ id: 'empty_hint', type: 'text', position: { x: 200, y: 250 }, data: { label: texts.unifilaire_hint, fontSize: 16, color: '#666' } });
      return { uNodes, uEdges };
    }

    let currentX = 100;
    const startY = 150;
    const totalWidth = (circuitKeys.length - 1) * 150;
    
    // Nœud principal "Alimentation"
    uNodes.push({
      id: 'uni_main', type: 'text',
      position: { x: 100 + totalWidth / 2 - 50, y: startY - 100 },
      data: { label: texts.main_supply, fontSize: 16, color: '#007bff' }
    });
    

    // Génération des branches (colonnes)
    circuitKeys.forEach((circuitName) => {
      const circ = circuits[circuitName];
      const breakerId = `uni_brk_${circuitName}`;
      
      // Le disjoncteur en tête de ligne
      uNodes.push({
        id: breakerId, type: 'breaker',
        position: { x: currentX, y: startY },
        data: { label: `Circ. ${circuitName}`, amperage: circ.breaker?.data?.amperage || '16A', circuit: circuitName }
      });

      // Le fil qui relie l'alimentation au disjoncteur (Type Step = Barre de pontage)
      uEdges.push({ id: `e_main_${breakerId}`, source: 'uni_main', target: breakerId, type: 'step', style: { stroke: '#333', strokeWidth: 3 } });

      let currentY = startY + 100;
      let prevId = breakerId;

      // Les composants reliés en dessous
      circ.components.forEach((comp, compIndex) => {
        const compId = `uni_comp_${circuitName}_${compIndex}`;
        
        uNodes.push({
          id: compId, type: comp.type,
          position: { x: currentX, y: currentY },
          data: { ...comp.data, rotation: 0 }, // Forcer la rotation à 0 sur l'unifilaire
        });

        uEdges.push({ id: `e_${prevId}_${compId}`, source: prevId, target: compId, type: 'straight', style: { stroke: '#333', strokeWidth: 2 } });

        prevId = compId;
        currentY += 80;
      });

      currentX += 150; // Décalage pour le prochain circuit
    });

    return { uNodes, uEdges };
  }, [viewMode, nodes, texts]), [viewMode, nodes, texts]);

  return { uNodes, uEdges };
};

  // Export de la nomenclature en CSV
  const exportToCSV = useCallback(() => {
    if (Object.keys(materialCounts).length === 0) return;
    
    let csvContent = lang === 'fr' ? "Composant,Quantité\n" : "Component,Quantity\n";
    Object.entries(materialCounts).forEach(([type, count]) => {
      csvContent += `"${texts[type]}",${count}\n`;
    });
    
    // Utilisation d'un BOM (Byte Order Mark) pour que Excel lise bien les accents
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `nomenclature_${projectData.projectName || 'projet'}.csv`);
    a.click();
    URL.revokeObjectURL(url);
  }, [materialCounts, texts, lang, projectData.projectName]);

  // Fonction pour prendre une "photo" du plan avant modification
  const takeSnapshot = useCallback(() => {
    setPast((p) => [...p.slice(-50), { nodes, edges }]); // On garde les 50 dernières actions
    setFuture([]);
  }, [nodes, edges]);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setFuture((f) => [{ nodes, edges }, ...f]);
    setPast((p) => p.slice(0, -1));
    setNodes(previous.nodes);
    setEdges(previous.edges);
  }, [past, future, nodes, edges, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setPast((p) => [...p, { nodes, edges }]);
    setFuture((f) => f.slice(1));
    setNodes(next.nodes);
    setEdges(next.edges);
  }, [past, future, nodes, edges, setNodes, setEdges]);

  // Fonction déclenchée quand l'utilisateur relie deux éléments
  const onConnect = useCallback((params) => {
    takeSnapshot();
    setEdges((eds) => addEdge({ 
      ...params, type: 'smoothstep', label: '3G2.5', 
      labelStyle: { fill: '#333', fontWeight: 700 }, labelBgStyle: { fill: '#f0f0f0' }
    }, eds));
  }, [setEdges, takeSnapshot]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Fonction pour calculer l'aimantation (snapping) d'un composant sur un mur
  const getSnappedPosition = useCallback((position, type, currentRotation, parentId) => {
    // On annule l'aimantation si le composant est dans un groupe (parentId)
    if (parentId) return { position, rotation: currentRotation, snapped: false };
    const snapComponents = ['socket', 'socket_double', 'socket_triple', 'switch', 'wall_light', 'door', 'window', 'junction_box', 'rj45', 'thermostat'];
    if (!snapComponents.includes(type)) return { position, rotation: currentRotation, snapped: false };

    let compW = 40;
    let compH = 40;
    if (type === 'door' || type === 'window') { compW = 50; compH = 50; }
    if (type === 'socket_double') { compW = 80; compH = 40; }
    if (type === 'socket_triple') { compW = 120; compH = 40; }

    let newRot = currentRotation || 0;
    let isRotated = newRot === 90 || newRot === 270;
    let currentW = isRotated ? compH : compW;
    let currentH = isRotated ? compW : compH;

    let cx = position.x + currentW / 2;
    let cy = position.y + currentH / 2;
    const SNAP_THRESHOLD = 30; // Distance max d'aimantation en pixels

    let newPos = { ...position };
    let snapped = false;

    for (const wall of nodes) {
      if (wall.type !== 'wall' || wall.id === 'wall_preview') continue;
      const wWidth = wall.style?.width || 15;
      const wHeight = wall.style?.height || 15;
      const wx1 = wall.position.x;
      const wy1 = wall.position.y;
      const wx2 = wx1 + wWidth;
      const wy2 = wy1 + wHeight;
      const isHorizontal = wWidth > wHeight;

      if (isHorizontal) {
        const wyCenter = wy1 + wHeight / 2;
        if (Math.abs(cy - wyCenter) < SNAP_THRESHOLD && cx >= wx1 - currentW / 2 && cx <= wx2 + currentW / 2) {
          if (newRot === 90 || newRot === 270) newRot = 0; // Aligne horizontalement
          isRotated = newRot === 90 || newRot === 270;
          currentH = isRotated ? compW : compH;
          newPos.y = wyCenter - currentH / 2;
          snapped = true;
          break;
        }
      } else {
        const wxCenter = wx1 + wWidth / 2;
        if (Math.abs(cx - wxCenter) < SNAP_THRESHOLD && cy >= wy1 - currentH / 2 && cy <= wy2 + currentH / 2) {
          if (newRot === 0 || newRot === 180) newRot = 90; // Aligne verticalement
          isRotated = newRot === 90 || newRot === 270;
          currentW = isRotated ? compH : compW;
          newPos.x = wxCenter - currentW / 2;
          snapped = true;
          break;
        }
      }
    }
    return { position: newPos, rotation: newRot, snapped };
  }, [nodes]);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('application/reactflow-label');
      const orientation = event.dataTransfer.getData('application/reactflow-orientation');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      // Calcule la position sur le canevas en tenant compte du zoom et du pan
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Si c'est un mur, on lui donne une taille par défaut (ex: 150px de long, 15px de large)
      // Sinon on le laisse s'adapter à son contenu
      const isWall = type === 'wall';
      const wallStyle = orientation === 'vertical' ? { width: 15, height: 150 } : { width: 150, height: 15 };
      const isRoom = type === 'room';
      const isArchitecture = type === 'door' || type === 'window';
      const isPanel = type === 'panel';
      const isBreaker = type === 'breaker';
      const isText = type === 'text';

      let defaultStyle = undefined;
      if (isWall) defaultStyle = wallStyle;
      if (isRoom) defaultStyle = { width: 200, height: 200, zIndex: -1 }; // La pièce passe en arrière-plan
      if (isPanel) defaultStyle = { width: 300, height: 200, zIndex: 0 }; // Le tableau juste au-dessus du mur
      if (isArchitecture) defaultStyle = { zIndex: 10 }; // Les portes/fenêtres par-dessus les murs
      if (isText) defaultStyle = { zIndex: 20 }; // Le texte tout au-dessus

      const { position: finalPosition, rotation: initialRotation } = getSnappedPosition(position, type, 0, undefined);

      takeSnapshot(); // On sauvegarde l'état avant d'ajouter le nœud

      const newNode = {
        id: getId(),
        type,
        position: finalPosition,
        data: { 
          label: label, 
          color: isWall ? '#333333' : isRoom ? '#009688' : isText ? '#333333' : undefined, 
          rotation: initialRotation, 
          amperage: isBreaker ? '16A' : undefined, 
          circuit: '',
          fontSize: isText ? 20 : undefined,
          width: defaultStyle?.width,
          height: defaultStyle?.height
        },
        style: defaultStyle,
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes, getSnappedPosition, takeSnapshot],
  );

  // Met à jour une propriété (data) de l'élément sélectionné
  const updateNodeData = useCallback((key, value) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode?.id) {
          return {
            ...node,
            data: { ...node.data, [key]: value },
          };
        }
        return node;
      })
    );
  }, [selectedNode, setNodes]);

  // Met à jour une propriété native (ex: draggable)
  const updateNodeProperty = useCallback((key, value) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode?.id) {
          return { ...node, [key]: value };
        }
        return node;
      })
    );
  }, [selectedNode, setNodes]);

  // Fonction pour gérer l'importation d'une image locale
  const handleImageUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      takeSnapshot();
      const newNode = {
        id: getId(), type: 'image', position: { x: 0, y: 0 },
        data: { src: e.target.result, opacity: 0.5 },
        style: { width: 800, height: 600, zIndex: -2 }, // Toujours au fond du plan (-2)
      };
      setNodes((nds) => nds.concat(newNode));
    };
    reader.readAsDataURL(file);
  }, [setNodes, takeSnapshot]);

  // Fonction pour grouper des éléments
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

  // Fonction pour dégrouper
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

  // Fonction pour dupliquer les éléments sélectionnés
  const onDuplicate = useCallback(() => {
    takeSnapshot();
    setNodes((nds) => {
      const currentlySelected = nds.filter((n) => n.selected);
      if (currentlySelected.length === 0) return nds;
      
      const newNodes = currentlySelected.map((node) => ({
        ...node,
        id: getId(),
        parentId: undefined, // On détache du groupe éventuel pour éviter les conflits
        selected: true,
        position: { x: node.position.x + 30, y: node.position.y + 30 },
      }));

      const unselected = nds.map((n) => ({ ...n, selected: false }));
      return [...unselected, ...newNodes];
    });
  }, [takeSnapshot, setNodes]);

  // S'active quand on relâche un composant après l'avoir déplacé
  const onNodeDragStop = useCallback((event, node) => {
    const { position: finalPosition, rotation: finalRotation, snapped } = getSnappedPosition(node.position, node.type, node.data?.rotation, node.parentId);

    if (snapped) {
      setNodes((nds) => nds.map((n) => {
        if (n.id === node.id) {
          return { ...n, position: finalPosition, data: { ...n.data, rotation: finalRotation } };
        }
        return n;
      }));
    }
  }, [getSnappedPosition, setNodes]);

  // Met à jour le texte du câble sélectionné
  const updateEdgeLabel = useCallback((value) => {
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === selectedEdge?.id) {
          return {
            ...edge,
            label: value,
          };
        }
        return edge;
      })
    );
  }, [selectedEdge, setEdges]);

  // Met à jour la couleur du câble sélectionné
  const updateEdgeColor = useCallback((color) => {
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === selectedEdge?.id) {
          const updatedEdge = {
            ...edge,
            style: { ...edge?.style, stroke: color },
          };
          // Si une flèche est active, on met aussi à jour sa couleur
          if (updatedEdge.markerEnd) {
            updatedEdge.markerEnd = { ...updatedEdge.markerEnd, color: color };
          }
          return updatedEdge;
        }
        return edge;
      })
    );
  }, [selectedEdge, setEdges]);

  // Met à jour la présence d'une flèche sur le câble
  const updateEdgeArrow = useCallback((hasArrow) => {
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === selectedEdge?.id) {
          if (hasArrow) {
            return { ...edge, markerEnd: { type: MarkerType.ArrowClosed, color: edge.style?.stroke || '#b1b1b7' } };
          } else {
            const { markerEnd, ...rest } = edge;
            return rest;
          }
        }
        return edge;
      })
    );
  }, [selectedEdge, setEdges]);

  // Met à jour le type du câble (courbe, angle droit, ligne droite)
  const updateEdgeType = useCallback((type) => {
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === selectedEdge?.id) {
          return {
            ...edge,
            type: type,
          };
        }
        return edge;
      })
    );
  }, [selectedEdge, setEdges]);

  // Met à jour le style (taille) de l'élément sélectionné
  const updateNodeStyle = useCallback((key, value) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode?.id) {
          return {
            ...node,
            style: { ...node.style, [key]: Math.max(1, value) },
          };
        }
        return node;
      })
    );
  }, [selectedNode, setNodes]);

  // Quitter le mode dessin avec la touche Echap et écouter les raccourcis Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsDrawingWall(false);
      
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) redo(); // Ctrl+Shift+Z = Redo
        else undo(); // Ctrl+Z = Undo
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        redo(); // Ctrl+Y = Redo
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        onDuplicate(); // Ctrl+D = Dupliquer
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, onDuplicate]);

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
      // Valider le mur actuel
      const dx = snappedPos.x - wallStartPoint.x;
      const dy = snappedPos.y - wallStartPoint.y;

      // Ignorer si aucun déplacement
      if (dx === 0 && dy === 0) return;

      takeSnapshot(); // On sauvegarde l'état avant d'ajouter le mur

      const isHorizontal = Math.abs(dx) > Math.abs(dy);

      // Calcule le point d'arrivée exact en forçant l'angle droit
      let actualNextPoint = isHorizontal 
        ? { x: snappedPos.x, y: wallStartPoint.y } 
        : { x: wallStartPoint.x, y: snappedPos.y };

      // A-t-on fermé la pièce en croisant notre point de départ (intersection) ?
      let isClosed = false;
      if (currentPath.length >= 3) {
        const startX = currentPath[0].x;
        const startY = currentPath[0].y;

        if (isHorizontal) {
          if (wallStartPoint.y === startY && 
              ((startX >= wallStartPoint.x && startX <= actualNextPoint.x) || 
               (startX <= wallStartPoint.x && startX >= actualNextPoint.x))) {
            isClosed = true;
            actualNextPoint.x = startX; // Raccourcir le mur pile au point de départ
          }
        } else {
          if (wallStartPoint.x === startX && 
              ((startY >= wallStartPoint.y && startY <= actualNextPoint.y) || 
               (startY <= wallStartPoint.y && startY >= actualNextPoint.y))) {
            isClosed = true;
            actualNextPoint.y = startY; // Raccourcir le mur pile au point de départ
          }
        }
      }

      // On ajoute 15 (2x 7.5px) à la longueur pour que les coins se chevauchent parfaitement
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
        id: getId(),
        type: 'wall',
        position: { x, y },
        data: { label: '', color: '#333333', width, height },
        style: { width, height },
      };

      // Anti-duplication : on vérifie s'il existe déjà un mur exactement identique
      const isDuplicate = nodes.some(n => n.type === 'wall' && n.position.x === x && n.position.y === y && n.style.width === width && n.style.height === height);

      if (isClosed) {
        const finalPath = [...currentPath, actualNextPoint];
        const minX = Math.min(...finalPath.map(p => p.x));
        const maxX = Math.max(...finalPath.map(p => p.x));
        const minY = Math.min(...finalPath.map(p => p.y));
        const maxY = Math.max(...finalPath.map(p => p.y));
        
        // Création automatique de la pièce ajustée aux dimensions intérieures des murs !
        const roomNode = {
          id: getId(),
          type: 'room',
          position: { x: minX + 7.5, y: minY + 7.5 },
          data: { label: texts.new_room || 'Nouvelle Pièce', color: '#009688', rotation: 0 },
          style: { width: Math.max(15, (maxX - minX) - 15), height: Math.max(15, (maxY - minY) - 15), zIndex: -1 }
        };
        
        setNodes((nds) => {
          let updatedNodes = nds.filter((n) => n.id !== 'wall_preview');
          if (!isDuplicate) updatedNodes = updatedNodes.concat(newWall);
          return updatedNodes.concat(roomNode);
        });
        // On quitte le mode dessin car la pièce est finie !
        setIsDrawingWall(false);
        setWallStartPoint(null);
        setCurrentPath([]);
      } else {
        setNodes((nds) => {
          let updatedNodes = nds.filter((n) => n.id !== 'wall_preview');
          return isDuplicate ? updatedNodes : updatedNodes.concat(newWall);
        });
        setWallStartPoint(actualNextPoint);
        setCurrentPath([...currentPath, actualNextPoint]);
      }
    }
  }, [isDrawingWall, wallStartPoint, currentPath, screenToFlowPosition, setNodes, texts.new_room, takeSnapshot]);

  // Pour éviter que cliquer sur une intersection bloque la création du mur
  const onNodeClick = useCallback((event) => {
    if (isDrawingWall) onPaneClick(event);
  }, [isDrawingWall, onPaneClick]);

  // Mouvement de souris pour l'aperçu du mur
  const onPaneMouseMove = useCallback((event) => {
    if (!isDrawingWall || !wallStartPoint) return;
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const snap = 15;
    const snappedPos = { x: Math.round(position.x / snap) * snap, y: Math.round(position.y / snap) * snap };
    const dx = snappedPos.x - wallStartPoint.x;
    const dy = snappedPos.y - wallStartPoint.y;
    const isHorizontal = Math.abs(dx) > Math.abs(dy);

    const actualNextPoint = isHorizontal 
      ? { x: snappedPos.x, y: wallStartPoint.y } 
      : { x: wallStartPoint.x, y: snappedPos.y };

    let width = 15, height = 15, x = 0, y = 0;
    // Application du même correctif de coins que pour le vrai mur
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
      data: { label: '', color: '#007bff', previewWidth: width, previewHeight: height },
      style: { width, height, opacity: 0.9, zIndex: 1000, pointerEvents: 'none' }, // pointerEvents évite de bloquer les clics
    }));
  }, [isDrawingWall, wallStartPoint, screenToFlowPosition, setNodes]);

  // Pour que l'aperçu ne saccade pas si on passe la souris sur un autre mur
  const onNodeMouseMove = useCallback((event) => {
    if (isDrawingWall) onPaneMouseMove(event);
  }, [isDrawingWall, onPaneMouseMove]);

  // Fonction pour exporter le schéma en image PNG
  const onExportImage = useCallback(() => {
    if (reactFlowWrapper.current === null) return;
    
    toPng(reactFlowWrapper.current, { 
      backgroundColor: projectData.canvasBgColor || '#f0f0f0',
      filter: (node) => {
        // On exclut les boutons de contrôle (zoom) de l'image finale
        if (node?.classList?.contains('react-flow__controls')) return false;
        return true;
      }
    }).then((dataUrl) => {
        const a = document.createElement('a');
        a.setAttribute('download', 'plan-electrique.png');
        a.setAttribute('href', dataUrl);
        a.click();
      }).catch((err) => console.error("Erreur lors de l'exportation", err));
  }, [projectData.canvasBgColor]);

  // Fonction pour imprimer le plan
  const onPrint = useCallback(() => {
    window.print();
  }, []);

  // Sauvegarder le plan manuellement
  const onSave = useCallback(() => {
    localStorage.setItem('voltflow-plan', JSON.stringify({ nodes, edges, projectData }));
    alert(texts.plan_saved);
  }, [nodes, edges, projectData, texts]);

  // Effacer tout le plan
  const onClear = useCallback(() => {
    if (window.confirm(texts.confirm_clear)) {
      takeSnapshot();
      setNodes([]);
      setEdges([]);
      setProjectData(initialProjectData);
      localStorage.removeItem('voltflow-plan');
    }
  }, [setNodes, setEdges, texts, takeSnapshot]);

  // Exporter le projet en fichier JSON
  const onExportJSON = useCallback(() => {
    const dataStr = JSON.stringify({ nodes, edges, projectData }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `${projectData.projectName || 'voltflow_projet'}.json`);
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges, projectData]);

  // Importer un projet depuis un fichier JSON
  const onImportJSON = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed.nodes && parsed.edges) {
          takeSnapshot(); // Permet d'annuler (Undo) si on a importé par erreur
          setNodes(parsed.nodes);
          setEdges(parsed.edges);
          if (parsed.projectData) setProjectData(parsed.projectData);
        } else {
          alert(lang === 'fr' ? "Fichier JSON invalide." : "Invalid JSON file.");
        }
      } catch (err) {
        alert(lang === 'fr' ? "Erreur de lecture du fichier." : "Error reading file.");
      }
    };
    reader.readAsText(file);
    event.target.value = null; // Réinitialise l'input pour pouvoir ré-importer le même fichier si besoin
  }, [setNodes, setEdges, setProjectData, takeSnapshot, lang]);

  // Recentre la caméra à chaque changement de mode de vue
  useEffect(() => {
    setTimeout(() => {
      fitView({ duration: 500, padding: 0.2 });
    }, 50);
  }, [viewMode, fitView]);

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', cursor: isDrawingWall ? 'crosshair' : 'default' }}>
      {/* Panneau de gauche (Boîte à outils) */}

        <Sidebar lang={lang} setLang={setLang} texts={texts} isDrawingWall={isDrawingWall} setIsDrawingWall={setIsDrawingWall} onExportImage={onExportImage} onPrint={onPrint} onSave={onSave} onClear={onClear} onExportJSON={onExportJSON} onImportJSON={onImportJSON} viewMode={viewMode} />
      )

      {/* Zone de dessin (Canvas) */}
      <div className={projectData.showDimensions === false ? "hide-room-dimensions" : ""} style={{ flexGrow: 1, background: projectData.canvasBgColor || '#f0f0f0', position: 'relative' }} ref={reactFlowWrapper}>
        {/* Boutons flottants pour ouvrir/fermer les panneaux */}
        <button className="no-print"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          style={{ position: 'absolute', top: '15px', left: '15px', zIndex: 10, background: '#fff', border: '2px solid #ccc', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
          title={isSidebarOpen ? "Fermer la boîte à outils" : "Ouvrir la boîte à outils"}
        >
          {isSidebarOpen ? '◀' : '▶ 🛠️'}
        </button>
        <button className="no-print"
          onClick={() => setIsPropertiesOpen(!isPropertiesOpen)}
          style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 10, background: '#fff', border: '2px solid #ccc', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
          title={isPropertiesOpen ? "Fermer les propriétés" : "Ouvrir les propriétés"}
        >
          {isPropertiesOpen ? '▶' : '⚙️ ◀'}
        </button>
        
        {/* Barre centrale (Changement de Mode + Undo/Redo) */}
        <div className="no-print" style={{ position: 'absolute', top: '15px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', gap: '15px', background: '#fff', padding: '5px 10px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button 
              onClick={() => setViewMode('plan')}
              style={{ padding: '5px 15px', borderRadius: '4px', border: 'none', background: viewMode === 'plan' ? '#007bff' : 'transparent', color: viewMode === 'plan' ? '#fff' : '#666', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {texts.view_plan}
            </button>
            <button 
              onClick={() => setViewMode('unifilaire')}
              style={{ padding: '5px 15px', borderRadius: '4px', border: 'none', background: viewMode === 'unifilaire' ? '#007bff' : 'transparent', color: viewMode === 'unifilaire' ? '#fff' : '#666', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {texts.view_unifilaire}
            </button>
          </div>
          
          <div style={{ width: '1px', height: '24px', background: '#ccc' }}></div>
          
          <div style={{ display: 'flex', gap: '5px' }}>
            <button 
              onClick={undo}
              disabled={past.length === 0 || viewMode !== 'plan'}
              style={{ background: '#f8f9fa', border: '1px solid #ccc', borderRadius: '4px', padding: '5px 10px', cursor: past.length === 0 || viewMode !== 'plan' ? 'not-allowed' : 'pointer', fontWeight: 'bold', opacity: past.length === 0 || viewMode !== 'plan' ? 0.5 : 1 }}
              title="Annuler (Ctrl+Z)"
            >
              {texts.undo}
            </button>
            <button 
              onClick={redo}
              disabled={future.length === 0 || viewMode !== 'plan'}
              style={{ background: '#f8f9fa', border: '1px solid #ccc', borderRadius: '4px', padding: '5px 10px', cursor: future.length === 0 || viewMode !== 'plan' ? 'not-allowed' : 'pointer', fontWeight: 'bold', opacity: future.length === 0 || viewMode !== 'plan' ? 0.5 : 1 }}
              title="Rétablir (Ctrl+Y)"
            >
              {texts.redo}
            </button>
          </div>
        </div>

        <ReactFlow 
          nodes={viewMode === 'plan' ? nodes : uNodes} 
          edges={viewMode === 'plan' ? edges : uEdges}
          onNodesChange={viewMode === 'plan' ? onNodesChange : undefined}
          onEdgesChange={viewMode === 'plan' ? onEdgesChange : undefined}
          onConnect={viewMode === 'plan' ? onConnect : undefined}
          onDrop={viewMode === 'plan' ? onDrop : undefined}
          onDragOver={viewMode === 'plan' ? onDragOver : undefined}
          onNodeDragStart={viewMode === 'plan' ? takeSnapshot : undefined}
          onNodesDelete={viewMode === 'plan' ? takeSnapshot : undefined}
          onEdgesDelete={viewMode === 'plan' ? takeSnapshot : undefined}
          onNodeDragStop={viewMode === 'plan' ? onNodeDragStop : undefined}
          nodeTypes={nodeTypes}
          onPaneClick={viewMode === 'plan' ? onPaneClick : undefined}
          onNodeClick={viewMode === 'plan' ? onNodeClick : undefined}
          onPaneMouseMove={viewMode === 'plan' ? onPaneMouseMove : undefined}
          onNodeMouseMove={viewMode === 'plan' ? onNodeMouseMove : undefined}
          nodesDraggable={viewMode === 'plan'}
          nodesConnectable={viewMode === 'plan'}
          elementsSelectable={viewMode === 'plan'}
          snapToGrid={true}
          snapGrid={[15, 15]}
          fitView
        >
          <Background variant="dots" color="#ccc" gap={15} size={2} />
          <Controls />
          
          {/* Cartouche professionnel en bas à droite */}
          {projectData.showCartouche !== false && (
            <Panel position="bottom-right" style={{ background: '#fff', border: '2px solid #333', padding: '15px', fontSize: '12px', width: '250px', borderRadius: '4px', pointerEvents: 'none' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px', borderBottom: '1px solid #333', paddingBottom: '5px', marginBottom: '10px', textTransform: 'uppercase' }}>
                {projectData.projectName || (lang === 'fr' ? 'PLAN ÉLECTRIQUE' : 'ELECTRICAL PLAN')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div><strong style={{ color: '#555' }}>{texts.client_name}</strong><br/>{projectData.clientName || '...'}</div>
                <div><strong style={{ color: '#555' }}>{texts.client_address}</strong><br/>{projectData.clientAddress || '...'}</div>
                <div><strong style={{ color: '#555' }}>{texts.installer_name}</strong><br/>{projectData.installerName || '...'}</div>
                <div><strong style={{ color: '#555' }}>{texts.date}</strong><br/>{projectData.date ? new Date(projectData.date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US') : '...'}</div>
              </div>
            </Panel>
          )}

          {/* Légende automatique en bas à gauche */}
          {projectData.showLegend !== false && Object.keys(materialCounts).length > 0 && (
            <Panel position="bottom-left" style={{ background: '#fff', border: '2px solid #333', padding: '15px', fontSize: '12px', minWidth: '150px', borderRadius: '4px', pointerEvents: 'none' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px', borderBottom: '1px solid #333', paddingBottom: '5px', marginBottom: '10px', textTransform: 'uppercase' }}>
                {texts.legend_title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {Object.keys(materialCounts).map((type) => (
                  <div key={type} style={{ color: '#444' }}>{texts[type]}</div>
                ))}
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>

      {/* Panneau de propriétés (à droite) */}
      {isPropertiesOpen && (
        <div className="no-print" style={{ width: '250px', background: '#fff', borderLeft: '1px solid #ccc', padding: '15px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {selectedNodes.length > 1 ? (
            <>
              <h3 style={{ marginBottom: '20px' }}>{texts.multi_selection} ({selectedNodes.length})</h3>
              <button onClick={onGroup} style={{ width: '100%', padding: '10px', background: '#e0e0e0', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px' }}>
                {texts.group}
              </button>
              <button onClick={onDuplicate} style={{ width: '100%', padding: '10px', background: '#e0e0e0', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                {texts.duplicate}
              </button>
            </>
          ) : selectedNode || selectedEdge ? (
            <>
              <h3 style={{ marginBottom: '20px' }}>{texts.properties}</h3>
            
            {selectedNode && selectedNode.type === 'group' && (
              <button onClick={onUngroup} style={{ width: '100%', padding: '10px', background: '#e0e0e0', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '15px' }}>
                {texts.ungroup}
              </button>
            )}
            
            {selectedNode && (
              <button onClick={onDuplicate} style={{ width: '100%', padding: '10px', background: '#e0e0e0', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '15px' }}>
                {texts.duplicate}
              </button>
            )}

            {/* Propriétés pour les Câbles */}
            {selectedEdge && (
              <>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px' }}>{texts.cable_section}</label>
                  <input 
                    type="text" 
                    value={selectedEdge.label || ''} 
                    onChange={(e) => updateEdgeLabel(e.target.value)}
                    style={{ width: '100%', padding: '5px', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px' }}>{texts.cable_color}</label>
                  <input 
                    type="color" 
                    value={selectedEdge.style?.stroke || '#b1b1b7'} 
                    onChange={(e) => updateEdgeColor(e.target.value)}
                    style={{ width: '100%', padding: '0', boxSizing: 'border-box', border: 'none', height: '30px', cursor: 'pointer' }}
                  />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px' }}>{texts.cable_type}</label>
                  <select 
                    value={selectedEdge.type || 'smoothstep'} 
                    onChange={(e) => updateEdgeType(e.target.value)}
                    style={{ width: '100%', padding: '5px', boxSizing: 'border-box' }}
                  >
                    <option value="smoothstep">{texts.cable_type_smoothstep}</option>
                    <option value="step">{texts.cable_type_step}</option>
                    <option value="straight">{texts.cable_type_straight}</option>
                  </select>
                </div>
                <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <input type="checkbox" id="hasArrow" checked={!!selectedEdge.markerEnd} onChange={(e) => updateEdgeArrow(e.target.checked)} />
                  <label htmlFor="hasArrow" style={{ fontSize: '12px', color: '#666', cursor: 'pointer', userSelect: 'none' }}>{texts.cable_arrow}</label>
                </div>
              </>
            )}
  
            {/* Nom / Label pour les composants et les pièces */}
            {selectedNode && selectedNode.type !== 'wall' && selectedNode.type !== 'group' && (
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px' }}>{texts.name_label}</label>
                <input 
                  type="text" 
                  value={selectedNode.data?.label || ''} 
                  onChange={(e) => updateNodeData('label', e.target.value)}
                  style={{ width: '100%', padding: '5px', boxSizing: 'border-box' }}
                />
              </div>
            )}
            
            {/* Propriétés du Circuit (Lien avec le schéma unifilaire) */}
            {selectedNode && ['light', 'spotlight', 'wall_light', 'socket', 'socket_double', 'socket_triple', 'switch', 'breaker'].includes(selectedNode.type) && (
              <div style={{ marginBottom: '10px', padding: '10px', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '4px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#007bff', fontWeight: 'bold', marginBottom: '5px' }}>{texts.circuit_name}</label>
                <input 
                  type="text" 
                  value={selectedNode.data?.circuit || ''} 
                  onChange={(e) => updateNodeData('circuit', e.target.value.toUpperCase())}
                  style={{ width: '100%', padding: '5px', boxSizing: 'border-box', border: '1px solid #007bff', outline: 'none' }}
                />
              </div>
            )}
  
            {/* Propriétés de taille pour le texte (ex: < </h1>
            {selectedNode && selectedNode.type === 'breaker' && (
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px' }}>{texts.amperage}</label>
                <input 
                  type="text" 
                  value={selectedNode.data?.amperage || ''} 
                  onChange={(e) => updateNodeData('amperage', e.target.value)}
                  style={{ width: '100%', padding: '5px', boxSizing: 'border-box' }}
                />
              </div>
            )}
  
            {/* Propriétés de rotation pour les composants électriques et architecturaux */}
            {selectedNode && ['light', 'spotlight', 'wall_light', 'socket', 'socket_double', 'socket_triple', 'door', 'window', 'switch', 'rj45', 'thermostat'].includes(selectedNode.type) && (
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px' }}>{texts.rotation}</label>
                <input 
                  type="number" 
                  step="90"
                  value={selectedNode.data?.rotation || 0} 
                  onChange={(e) => updateNodeData('rotation', parseInt(e.target.value, 10) || 0)}
                  style={{ width: '100%', padding: '5px', boxSizing: 'border-box' }}
                />
              </div>
            )}
  
            {/* Propriétés de taille pour les murs */}
            {selectedNode && selectedNode.type === 'wall' && (
              <>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px' }}>{texts.wall_length}</label>
                  <input 
                    type="number" 
                    value={selectedNode.style?.width > selectedNode.style?.height ? selectedNode.style?.width : selectedNode.style?.height || 0} 
                    onChange={(e) => updateNodeStyle(selectedNode.style?.width > selectedNode.style?.height ? 'width' : 'height', parseInt(e.target.value, 10) || 15)}
                    style={{ width: '100%', padding: '5px', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px' }}>{texts.wall_thickness}</label>
                  <input 
                    type="number" 
                    value={selectedNode.style?.width > selectedNode.style?.height ? selectedNode.style?.height : selectedNode.style?.width || 0} 
                    onChange={(e) => updateNodeStyle(selectedNode.style?.width > selectedNode.style?.height ? 'height' : 'width', parseInt(e.target.value, 10) || 15)}
                    style={{ width: '100%', padding: '5px', boxSizing: 'border-box' }}
                  />
                </div>
              </>
            )}
            
            {/* Propriétés de taille pour le texte */}
            {selectedNode && selectedNode.type === 'text' && (
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px' }}>{texts.font_size}</label>
                <input 
                  type="number" 
                  value={selectedNode.data?.fontSize || 20} 
                  onChange={(e) => updateNodeData('fontSize', parseInt(e.target.value, 10) || 20)}
                  style={{ width: '100%', padding: '5px', boxSizing: 'border-box' }}
                />
              </div>
            )}
  
            {/* Propriétés de couleur pour les murs, pièces et textes */}
            {selectedNode && ['wall', 'room', 'text'].includes(selectedNode.type) && (
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px' }}>{selectedNode.type === 'text' ? texts.text_color : texts.bg_color}</label>
                <input 
                  type="color" 
                  value={selectedNode.data?.color || '#333333'} 
                  onChange={(e) => updateNodeData('color', e.target.value)}
                  style={{ width: '100%', padding: '0', boxSizing: 'border-box', border: 'none', height: '30px', cursor: 'pointer' }}
                />
              </div>
            )}
            
            {/* Propriétés pour le Verrouillage */}
            {selectedNode && (
              <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                <input type="checkbox" id="lockPos" checked={selectedNode.draggable === false} onChange={(e) => updateNodeProperty('draggable', !e.target.checked)} />
                <label htmlFor="lockPos" style={{ fontSize: '12px', color: '#666', cursor: 'pointer', userSelect: 'none' }}>{texts.lock}</label>
              </div>
            )}
            </>
          ) : (
            <>
              <h3 style={{ marginBottom: '20px' }}>{texts.project_settings}</h3>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px' }}>{texts.project_name}</label>
                <input type="text" value={projectData.projectName || ''} onChange={(e) => setProjectData({...projectData, projectName: e.target.value})} style={{ width: '100%', padding: '5px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px' }}>{texts.client_name}</label>
                <input type="text" value={projectData.clientName || ''} onChange={(e) => setProjectData({...projectData, clientName: e.target.value})} style={{ width: '100%', padding: '5px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px' }}>{texts.client_address}</label>
                <input type="text" value={projectData.clientAddress || ''} onChange={(e) => setProjectData({...projectData, clientAddress: e.target.value})} style={{ width: '100%', padding: '5px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px' }}>{texts.installer_name}</label>
                <input type="text" value={projectData.installerName || ''} onChange={(e) => setProjectData({...projectData, installerName: e.target.value})} style={{ width: '100%', padding: '5px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px' }}>{texts.date}</label>
                <input type="date" value={projectData.date || ''} onChange={(e) => setProjectData({...projectData, date: e.target.value})} style={{ width: '100%', padding: '5px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input type="checkbox" id="showCartouche" checked={projectData.showCartouche !== false} onChange={(e) => setProjectData({...projectData, showCartouche: e.target.checked})} />
                <label htmlFor="showCartouche" style={{ fontSize: '12px', color: '#666', cursor: 'pointer', userSelect: 'none' }}>{texts.show_cartouche}</label>
              </div>
              <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input type="checkbox" id="showDimensions" checked={projectData.showDimensions !== false} onChange={(e) => setProjectData({...projectData, showDimensions: e.target.checked})} />
                <label htmlFor="showDimensions" style={{ fontSize: '12px', color: '#666', cursor: 'pointer', userSelect: 'none' }}>{texts.show_dimensions}</label>
              </div>
              <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input type="checkbox" id="showLegend" checked={projectData.showLegend !== false} onChange={(e) => setProjectData({...projectData, showLegend: e.target.checked})} />
                <label htmlFor="showLegend" style={{ fontSize: '12px', color: '#666', cursor: 'pointer', userSelect: 'none' }}>{texts.show_legend}</label>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px' }}>{texts.canvas_bg_color}</label>
                <input type="color" value={projectData.canvasBgColor || '#f0f0f0'} onChange={(e) => setProjectData({...projectData, canvasBgColor: e.target.value})} style={{ width: '100%', padding: '0', boxSizing: 'border-box', border: 'none', height: '30px', cursor: 'pointer' }} />
              </div>
              <div style={{ marginBottom: '10px', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px', fontWeight: 'bold' }}>{texts.import_plan}</label>
                <input type="file" accept="image/png, image/jpeg, image/jpg, image/webp" onChange={handleImageUpload} style={{ width: '100%', fontSize: '12px', cursor: 'pointer' }} />
              </div>

              {/* Nomenclature / Liste du matériel */}
              <div style={{ marginBottom: '10px', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#333' }}>{texts.bill_of_materials}</h4>
                {Object.keys(materialCounts).length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>{texts.empty_materials}</div>
                ) : (
                  <>
                    <ul style={{ listStyleType: 'none', padding: 0, margin: 0, fontSize: '12px', color: '#555', marginBottom: '10px' }}>
                      {Object.entries(materialCounts).map(([type, count]) => (
                        <li key={type} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', borderBottom: '1px dashed #eee', paddingBottom: '3px' }}>
                          <span>{texts[type]}</span>
                          <span style={{ fontWeight: 'bold' }}>x{count}</span>
                        </li>
                      ))}
                    </ul>
                    <button 
                      onClick={exportToCSV}
                      style={{ width: '100%', padding: '8px', background: '#e0e0e0', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', color: '#333' }}
                    >
                      {texts.export_csv}
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Editor />
    </ReactFlowProvider>
  );
}
}
