import React, { useState, useRef, useCallback, useEffect, useMemo, useContext } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  useEdgesState,
  Panel,
  MarkerType,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';

// Contexte
import { StandardContext } from './StandardContext.jsx';

// Hooks personnalisés
import { useUndoRedo } from './hooks/useUndoRedo.js';
import { useFileHandlers } from './hooks/useFileHandlers.js';
import { useWallDrawer } from './hooks/useWallDrawer.js';
import { useNodeManagement } from './hooks/useNodeManagement.js';
// --- NOUVEAU : Import du hook pour détecter les pièces ---
import { useRoomDetector } from './hooks/useRoomDetector.js';
import { getLayoutedElements } from './layout.js';

// Pages
import Home from './pages/Home.jsx';
import Auth from './pages/Auth.jsx';
import Profile from './pages/Profile.jsx';
import Features from './pages/Features.jsx';
import Pricing from './pages/Pricing.jsx';

// Composants
import Sidebar from './Sidebar.jsx';
import SettingsModal from './SettingsModal.jsx';
import LevelManager from './LevelManager.jsx';
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
import SwitchTwoWayNode from './SwitchTwoWayNode.jsx';
import PushButtonNode from './PushButtonNode.jsx';
import JunctionBoxNode from './JunctionBoxNode.jsx';
import SpotLightNode from './SpotLightNode.jsx';
import WallLightNode from './WallLightNode.jsx';
import TextNode from './TextNode.jsx';
import ImageNode from './ImageNode.jsx';
import Rj45Node from './Rj45Node.jsx';
import ThermostatNode from './ThermostatNode.jsx';
import CameraNode from './CameraNode.jsx';
import RcdNode from './RcdNode.jsx';
import { t } from './translations.js';

const initialNodeTypes = {
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
  switch_two_way: SwitchTwoWayNode,
  push_button: PushButtonNode,
  junction_box: JunctionBoxNode,
  spotlight: SpotLightNode,
  wall_light: WallLightNode,
  text: TextNode,
  image: ImageNode,
  rj45: Rj45Node,
  thermostat: ThermostatNode,
  camera: CameraNode,
  rcd: RcdNode,
};

const initialLevel = { id: 'level_0', name: 'Rez-de-chaussée', nodes: [], edges: [] };

const initialPlan = {
  levels: [initialLevel],
  activeLevelId: 'level_0',
  projectData: {
    projectName: '', clientName: '', clientAddress: '', installerName: '',
    date: new Date().toISOString().split('T')[0],
    showCartouche: false, showDimensions: true, showLegend: true, canvasBgColor: '#f0f0f0',
    standard: 'be'
  }
};

const getSavedPlan = (currentUser) => {
  const saved = localStorage.getItem('voltflow-plan');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.nodes && !parsed.levels) {
        const migratedLevel = { id: 'level_0', name: 'Rez-de-chaussée', nodes: parsed.nodes, edges: parsed.edges || [] };
        return { levels: [migratedLevel], activeLevelId: 'level_0', projectData: parsed.projectData || initialPlan.projectData };
      }
      const projectData = { ...initialPlan.projectData, ...(parsed.projectData || {}) };
      if (!projectData.installerName && currentUser?.name) {
        projectData.installerName = currentUser.name;
      }
      return { ...initialPlan, ...parsed, projectData };
    } catch (e) { console.error("Erreur chargement", e); }
  }
  const newProjectData = { ...initialPlan.projectData };
  if (!newProjectData.installerName && currentUser?.name) {
    newProjectData.installerName = currentUser.name;
  }
  return { ...initialPlan, projectData: newProjectData };
};

function Editor() {
  const { fitView } = useReactFlow();
  const reactFlowWrapper = useRef(null);
  const [lang, setLang] = useState('fr');
  const [theme, setTheme] = useState(localStorage.getItem('voltflow-theme') || 'light');
  const texts = t[lang];

  // Memoize nodeTypes pour éviter le warning React Flow
  const nodeTypes = useMemo(() => initialNodeTypes, []);

  const [currentUser, setCurrentUser] = useState({ name: 'Jean Dupont', email: 'jean.dupont@exemple.com' });
  const [currentPage, setCurrentPage] = useState('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('plan');
  const [isDrawingWall, setIsDrawingWall] = useState(false);
  const [activeMainCircuit, setActiveMainCircuit] = useState('A');
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Trigger force refresh

  const { state, setState, takeSnapshot, undo, redo, canUndo, canRedo } = useUndoRedo(getSavedPlan(currentUser));
  const { levels, activeLevelId, projectData } = state;
  const standard = projectData.standard || 'be';

  const activeLevel = useMemo(() => levels.find(l => l.id === activeLevelId) || levels[0], [levels, activeLevelId]);

  // Nœuds de base (murs, symboles, etc. dessinés par l'utilisateur)
  const nodes = activeLevel.nodes;
  const edges = activeLevel.edges;

  // --- NOUVEAU : Détection automatique des pièces et fusion avec le plan ---
  const detectedRooms = useRoomDetector(nodes);

  // On place detectedRooms en premier pour qu'ils soient affichés en arrière-plan (sous les murs)
  const planNodes = useMemo(() => [...detectedRooms, ...nodes], [detectedRooms, nodes]);
  // --------------------------------------------------------------------------

  // Réajuster la vue lors du changement de mode (plan <-> unifilaire)
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.2, duration: 500 });
    }, 100);
    return () => clearTimeout(timer);
  }, [viewMode, fitView, refreshTrigger]);

  const setNodes = useCallback((newNodes) => {
    setState(cs => ({
      ...cs,
      levels: cs.levels.map(l => l.id === activeLevelId ? { ...l, nodes: typeof newNodes === 'function' ? newNodes(l.nodes) : newNodes } : l)
    }));
  }, [setState, activeLevelId]);

  const setEdges = useCallback((newEdges) => {
    setState(cs => ({
      ...cs,
      levels: cs.levels.map(l => l.id === activeLevelId ? { ...l, edges: typeof newEdges === 'function' ? newEdges(l.edges) : newEdges } : l)
    }));
  }, [setState, activeLevelId]);

  const setProjectData = useCallback((newProjectData) => setState(cs => ({ ...cs, projectData: typeof newProjectData === 'function' ? newProjectData(cs.projectData) : newProjectData })), [setState]);
  const setActiveLevelId = useCallback((id) => setState(cs => ({ ...cs, activeLevelId: id })), [setState]);

  const addLevel = useCallback(() => {
    takeSnapshot();
    const newId = `level_${Date.now()}`;
    const newLevel = { id: newId, name: `${texts.new_level} ${levels.length + 1}`, nodes: [], edges: [] };
    setState(cs => ({ ...cs, levels: [...cs.levels, newLevel], activeLevelId: newId }));
  }, [setState, levels.length, takeSnapshot, texts.new_level]);

  const deleteLevel = useCallback((id) => {
    if (levels.length <= 1) return;
    if (window.confirm(texts.delete_floor_confirm)) {
      takeSnapshot();
      setState(cs => {
        const nextLevels = cs.levels.filter(l => l.id !== id);
        return { ...cs, levels: nextLevels, activeLevelId: nextLevels[0].id };
      });
    }
  }, [levels.length, setState, takeSnapshot, texts.delete_floor_confirm]);

  const renameLevel = useCallback((id, newName) => {
    setState(cs => ({ ...cs, levels: cs.levels.map(l => l.id === id ? { ...l, name: newName } : l) }));
  }, [setState]);

  const selectedNodes = useMemo(() => nodes.filter(n => n.selected), [nodes]);
  const selectedNode = useMemo(() => selectedNodes.length === 1 ? selectedNodes[0] : null, [selectedNodes]);
  const selectedEdges = useMemo(() => edges.filter(e => e.selected), [edges]);
  const selectedEdge = useMemo(() => selectedEdges.length === 1 ? selectedEdges[0] : null, [selectedEdges]);

  const setActiveCircuit = useCallback((fullCircuit) => {
    const main = fullCircuit.match(/^[A-Z]+/)?.[0];
    if (main) setActiveMainCircuit(main);
  }, []);

  const { onNodesChange, onNodesDelete, onNodeDragStop, onConnect, onDrop, updateNodeData, updateNodeProperty, updateNodeStyle, updateEdgeLabel, updateEdgeColor, updateEdgeArrow, updateEdgeType, onGroup, onUngroup, onDuplicate } = useNodeManagement({ nodes, levels, setNodes, setEdges, takeSnapshot, selectedNodes, selectedNode, selectedEdge, activeCircuit: activeMainCircuit, setActiveCircuit, setState });

  // --- Le WallDrawer reçoit bien les `nodes` (utilisateurs) et pas planNodes pour ne pas s'embrouiller ---
  const { onPaneClick, onPaneMouseMove, onPaneContextMenu } = useWallDrawer({ isDrawingWall, setIsDrawingWall, nodes, setNodes, takeSnapshot, texts });

  const materialCounts = useMemo(() => {
    const counts = {};
    const electricalTypes = ['light', 'spotlight', 'wall_light', 'socket', 'socket_double', 'socket_triple', 'switch', 'switch_two_way', 'push_button', 'junction_box', 'breaker', 'panel', 'rj45', 'thermostat', 'camera'];
    levels.forEach(level => {
      level.nodes.forEach(node => { if (electricalTypes.includes(node.type)) counts[node.type] = (counts[node.type] || 0) + 1; });
    });
    return counts;
  }, [levels]);

  const { uNodes, uEdges } = useMemo(() => {
    if (viewMode !== 'unifilaire') return { uNodes: [], uEdges: [] };

    const initialNodes = [];
    const initialEdges = [];
    const circuits = {};

    // Forcer le recalcule
    const _ = refreshTrigger;

    levels.forEach(level => {
      level.nodes.forEach(n => {
        const circuitName = n.data?.circuit;
        if (circuitName !== null && circuitName !== undefined && String(circuitName).trim() !== '') {
          const c = String(circuitName).trim().toUpperCase();
          if (!circuits[c]) circuits[c] = { components: [], breaker: null };
          if (n.type === 'breaker' || n.type === 'rcd') circuits[c].breaker = n;
          else circuits[c].components.push(n);
        }
      });
    });

    const circuitKeys = Object.keys(circuits).sort();

    if (circuitKeys.length === 0) {
      initialNodes.push({ id: 'empty', type: 'text', position: { x: 200, y: 200 }, data: { label: texts.no_circuit, fontSize: 24, color: '#dc3545' } });
      return { uNodes: initialNodes, uEdges: initialEdges };
    }

    initialNodes.push({
      id: 'uni_main',
      type: 'default',
      data: { label: texts.main_supply },
      style: {
        background: 'transparent',
        border: 'none',
        fontSize: '16px',
        fontWeight: 'bold',
        color: 'var(--accent)',
        textAlign: 'center'
      }
    });

    circuitKeys.forEach((circuitName) => {
      const circ = circuits[circuitName];
      const brkId = `uni_brk_${circuitName}`;

      initialNodes.push({
        id: brkId,
        type: circ.breaker ? circ.breaker.type : 'breaker',
        data: {
          label: `Circ. ${circuitName}`,
          amperage: circ.breaker?.data?.amperage || '16A',
          circuit: circuitName
        }
      });
      initialEdges.push({
        id: `e_main_${brkId}`,
        source: 'uni_main',
        target: brkId,
        type: 'smoothstep'
      });

      let prevId = brkId;
      circ.components.forEach((comp, idx) => {
        const cId = `uni_c_${circuitName}_${idx}`;
        initialNodes.push({
          id: cId,
          type: comp.type,
          data: { ...comp.data, rotation: 0 }
        });
        initialEdges.push({
          id: `e_${prevId}_${cId}`,
          source: prevId,
          target: cId,
          type: 'smoothstep'
        });
        prevId = cId;
      });
    });

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges);

    return { uNodes: layoutedNodes, uEdges: layoutedEdges };
  }, [viewMode, levels, texts, refreshTrigger]);

  const { onExportImage, onSave, onClear, onExportJSON, onImportJSON, exportToCSV, onExportPDF, isGeneratingPDF, handleImageUpload } = useFileHandlers({ nodes: levels.flatMap(l => l.nodes), edges: levels.flatMap(l => l.edges), levels, activeLevelId, projectData, setNodes, setEdges, setProjectData, setActiveLevelId, takeSnapshot, reactFlowWrapper, texts, lang });

  const onNodeDoubleClick = useCallback((event, node) => {
    const currentCircuit = node.data?.circuit;
    if (currentCircuit) {
      const newCircuit = window.prompt(texts.rename_circuit_prompt, currentCircuit);
      if (newCircuit && newCircuit !== currentCircuit) {
        takeSnapshot();
        const formattedNew = newCircuit.toUpperCase();
        setState(cs => ({ ...cs, levels: cs.levels.map(l => ({ ...l, nodes: l.nodes.map(n => n.data?.circuit === currentCircuit ? { ...n, data: { ...n.data, circuit: formattedNew } } : n) })) }));
        const newMain = formattedNew.match(/^[A-Z]+/)?.[0];
        if (newMain) setActiveMainCircuit(newMain);
      }
    }
  }, [setState, takeSnapshot, texts.rename_circuit_prompt]);

  const existingCircuits = useMemo(() => {
    const circuits = new Set();
    levels.forEach(l => l.nodes.forEach(n => { if(n.data?.circuit) circuits.add(n.data.circuit) }));
    return Array.from(circuits);
  }, [levels]);

  const handleSuggestNewCircuit = useCallback(() => {
    if (!selectedNode) return;
    takeSnapshot();
    const topLevelCircuits = new Set(existingCircuits.map(c => c.charAt(0)));
    let nextLetter = 'A';
    while (topLevelCircuits.has(nextLetter)) { nextLetter = String.fromCharCode(nextLetter.charCodeAt(0) + 1); }
    setActiveMainCircuit(nextLetter);
    updateNodeData('circuit', nextLetter + '1');
  }, [selectedNode, existingCircuits, updateNodeData, takeSnapshot]);

  const handleSuggestSubCircuit = useCallback(() => {
    if (!selectedNode || !selectedNode.data?.circuit) return;
    takeSnapshot();
    const baseCircuit = selectedNode.data.circuit.match(/^[A-Z]+/)?.[0];
    if (!baseCircuit) return;
    const subCircuitRegex = new RegExp(`^${baseCircuit}(\\d+)$`);
    let maxNum = 0;
    existingCircuits.forEach(c => {
      const match = c.match(subCircuitRegex);
      if (match) { const num = parseInt(match[1], 10); if (num > maxNum) maxNum = num; }
    });
    updateNodeData('circuit', `${baseCircuit}${maxNum + 1}`);
  }, [selectedNode, existingCircuits, updateNodeData, takeSnapshot]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('voltflow-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsDrawingWall(false);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') { e.preventDefault(); onDuplicate(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, onDuplicate]);

  const toggleButtonStyle = {
    background: 'var(--panel-bg)', border: '1px solid var(--border)', borderRadius: '4px',
    padding: '5px 10px', cursor: 'pointer', color: 'var(--text-color)',
    fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <Home onStartEditor={() => setCurrentPage('editor')} onLoginClick={() => setCurrentPage('auth')} texts={texts} onFeaturesClick={() => setCurrentPage('features')} onPricingClick={() => setCurrentPage('pricing')} lang={lang} setLang={setLang} />;
      case 'features': return <Features onBack={() => setCurrentPage('home')} texts={texts} />;
      case 'pricing': return <Pricing onBack={() => setCurrentPage('home')} texts={texts} />;
      case 'auth': return <Auth onLogin={() => { setCurrentUser({ name: 'Jean Dupont', email: 'jean.dupont@exemple.com' }); setCurrentPage('editor'); }} onBack={() => setCurrentPage('home')} texts={texts} />;
      case 'profile': return <Profile onLogout={() => { setCurrentUser(null); setCurrentPage('home'); }} onBackToEditor={() => setCurrentPage('editor')} currentUser={currentUser} texts={texts} />;
      case 'editor': return (
          <StandardContext.Provider value={standard}>
            <div style={{ display: 'flex', width: '100%', height: '100vh', cursor: isDrawingWall ? 'crosshair' : 'default', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', overflow: 'hidden' }}>
              {viewMode === 'plan' && isSidebarOpen && (
                  <Sidebar lang={lang} setLang={setLang} texts={texts} isDrawingWall={isDrawingWall} setIsDrawingWall={setIsDrawingWall} onExportImage={onExportImage} onSave={onSave} onClear={onClear} onExportJSON={onExportJSON} onImportJSON={onImportJSON} onExportPDF={() => onExportPDF(uNodes, uEdges, materialCounts)} viewMode={viewMode} theme={theme} setTheme={setTheme} onSettingsClick={() => setIsSettingsModalOpen(true)} activeCircuit={activeMainCircuit} setActiveCircuit={setActiveMainCircuit} isGeneratingPDF={isGeneratingPDF} onProfileClick={() => setCurrentPage('profile')} />
              )}
              <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} theme={theme} setTheme={setTheme} lang={lang} setLang={setLang} texts={texts} projectData={projectData} setProjectData={setProjectData} />
              <div className={projectData.showDimensions === false ? "hide-room-dimensions" : ""} style={{ flexGrow: 1, height: '100%', background: projectData.canvasBgColor || 'var(--bg-color)', position: 'relative', overflow: 'hidden' }} ref={reactFlowWrapper}>

                {viewMode === 'plan' && (
                    <button className="no-print" onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ position: 'absolute', top: '15px', left: '15px', zIndex: 10, ...toggleButtonStyle }}>{isSidebarOpen ? '⬅️' : '➡️ 🛠️'}</button>
                )}
                {viewMode === 'plan' && (
                    <button className="no-print" onClick={() => setIsPropertiesOpen(!isPropertiesOpen)} style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 10, ...toggleButtonStyle }}>{isPropertiesOpen ? '➡️' : '📝 ⬅️'}</button>
                )}

                <div className="no-print" style={{ position: 'absolute', top: '15px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', gap: '15px', background: 'var(--panel-bg)', padding: '5px 10px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', alignItems: 'center', border: '1px solid var(--border)' }}>
                  {viewMode === 'plan' && (
                      <>
                        <LevelManager levels={levels} activeLevelId={activeLevelId} setActiveLevelId={setActiveLevelId} addLevel={addLevel} deleteLevel={deleteLevel} renameLevel={renameLevel} texts={texts} />
                        <div style={{ width: '1px', height: '24px', background: 'var(--border)' }}></div>
                      </>
                  )}

                  <button onClick={() => setViewMode('plan')} style={{ padding: '5px 15px', borderRadius: '4px', border: 'none', background: viewMode === 'plan' ? 'var(--button-primary-bg)' : 'transparent', color: viewMode === 'plan' ? '#fff' : 'var(--text-color)', fontWeight: 'bold', cursor: 'pointer' }}>{texts.view_plan}</button>
                  <button onClick={() => setViewMode('unifilaire')} style={{ padding: '5px 15px', borderRadius: '4px', border: 'none', background: viewMode === 'unifilaire' ? 'var(--button-primary-bg)' : 'transparent', color: viewMode === 'unifilaire' ? '#fff' : 'var(--text-color)', fontWeight: 'bold', cursor: 'pointer' }}>{texts.view_unifilaire}</button>

                  {viewMode === 'unifilaire' && (
                      <button onClick={() => setRefreshTrigger(r => r + 1)} style={{ padding: '5px 15px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--item-bg)', color: 'var(--text-color)', fontWeight: 'bold', cursor: 'pointer' }}>🔄 Rafraîchir</button>
                  )}

                  <div style={{ width: '1px', height: '24px', background: 'var(--border)' }}></div>
                  <button onClick={undo} disabled={!canUndo} style={{ background: 'var(--item-bg)', border: '1px solid var(--border)', color: 'var(--text-color)', borderRadius: '4px', padding: '5px 10px', cursor: !canUndo ? 'not-allowed' : 'pointer', fontWeight: 'bold', opacity: !canUndo ? 0.5 : 1 }}>↩️</button>
                  <button onClick={redo} disabled={!canRedo} style={{ background: 'var(--item-bg)', border: '1px solid var(--border)', color: 'var(--text-color)', borderRadius: '4px', padding: '5px 10px', cursor: !canRedo ? 'not-allowed' : 'pointer', fontWeight: 'bold', opacity: !canRedo ? 0.5 : 1 }}>↪️</button>

                  {viewMode === 'unifilaire' && (
                      <>
                        <div style={{ width: '1px', height: '24px', background: 'var(--border)' }}></div>
                        <button onClick={() => onExportPDF(uNodes, uEdges, materialCounts)} disabled={isGeneratingPDF} style={{ padding: '5px 15px', borderRadius: '4px', border: 'none', background: '#28a745', color: '#fff', fontWeight: 'bold', cursor: isGeneratingPDF ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {isGeneratingPDF ? '⏳ ...' : texts.export_pdf}
                        </button>
                      </>
                  )}
                </div>
                <ReactFlow
                    // --- NOUVEAU : On utilise planNodes (murs + pièces) au lieu de nodes ---
                    nodes={viewMode === 'plan' ? planNodes : uNodes}
                    edges={viewMode === 'plan' ? edges : uEdges}
                    onNodesChange={viewMode === 'plan' ? onNodesChange : undefined}
                    onNodesDelete={viewMode === 'plan' ? onNodesDelete : undefined}
                    onEdgesChange={viewMode === 'plan' ? setEdges : undefined}
                    onConnect={onConnect}
                    onDrop={onDrop}
                    onDragOver={(e) => e.preventDefault()}
                    nodeTypes={nodeTypes}
                    onPaneClick={onPaneClick}
                    onPaneMouseMove={onPaneMouseMove}
                    onPaneContextMenu={onPaneContextMenu} // <--- Important pour l'annulation (clic droit)
                    onNodeDoubleClick={onNodeDoubleClick}
                    onNodeDragStop={viewMode === 'plan' ? onNodeDragStop : undefined}
                    nodesDraggable={viewMode === 'plan'}
                    nodesConnectable={viewMode === 'plan'}
                    elementsSelectable={true}
                    snapToGrid={true}
                    snapGrid={[15, 15]}
                    fitView
                >
                  <Background variant="dots" color={theme === 'dark' ? '#555' : '#ccc'} gap={15} size={2} />
                  <Controls />
                  {projectData.showCartouche && (
                      <Panel position="bottom-right" style={{ background: 'var(--panel-bg)', color: 'var(--text-color)', border: '2px solid var(--panel-border)', padding: '15px', fontSize: '12px', width: '250px', borderRadius: '4px', pointerEvents: 'none' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '14px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '5px', marginBottom: '10px', textTransform: 'uppercase' }}>{projectData.projectName || texts.view_plan}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div><strong style={{ opacity: 0.7 }}>{texts.client_name}</strong><br/>{projectData.clientName || '...'}</div>
                          <div><strong style={{ opacity: 0.7 }}>{texts.client_address}</strong><br/>{projectData.clientAddress || '...'}</div>
                          <div><strong style={{ opacity: 0.7 }}>{texts.installer_name}</strong><br/>{projectData.installerName || '...'}</div>
                          <div><strong style={{ opacity: 0.7 }}>{texts.date}</strong><br/>{projectData.date ? new Date(projectData.date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US') : '...'}</div>
                        </div>
                      </Panel>
                  )}
                </ReactFlow>
              </div>
              {viewMode === 'plan' && isPropertiesOpen && (
                  <div className="no-print" style={{ width: '250px', height: '100%', background: 'var(--sidebar-bg)', color: 'var(--text-color)', borderLeft: '1px solid var(--sidebar-border)', padding: '15px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                    {selectedNodes.length > 1 ? (
                        <>
                          <h3 style={{ marginBottom: '20px' }}>{texts.multi_selection} ({selectedNodes.length})</h3>
                          <button onClick={onGroup} style={{ width: '100%', padding: '10px', background: 'var(--item-hover)', color: 'var(--text-color)', border: '1px solid var(--item-border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px' }}>{texts.group}</button>
                          <button onClick={onDuplicate} style={{ width: '100%', padding: '10px', background: 'var(--item-hover)', color: 'var(--text-color)', border: '1px solid var(--item-border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>{texts.duplicate}</button>
                        </>
                    ) : selectedNode || selectedEdge ? (
                        <>
                          <h3 style={{ marginBottom: '20px' }}>{texts.properties}</h3>
                          {selectedNode && selectedNode.type === 'group' && (<button onClick={onUngroup} style={{ width: '100%', padding: '10px', background: 'var(--item-hover)', color: 'var(--text-color)', border: '1px solid var(--item-border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '15px' }}>{texts.ungroup}</button>)}
                          {selectedNode && (<button onClick={onDuplicate} style={{ width: '100%', padding: '10px', background: 'var(--item-hover)', color: 'var(--text-color)', border: '1px solid var(--item-border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '15px' }}>{texts.duplicate}</button>)}
                          {selectedEdge && (
                              <>
                                <div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>{texts.cable_section}</label><input type="text" value={selectedEdge.label || ''} onFocus={takeSnapshot} onChange={(e) => updateEdgeLabel(e.target.value)} style={{ width: '100%', padding: '5px' }}/></div>
                                <div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>{texts.cable_color}</label><input type="color" value={selectedEdge.style?.stroke || '#b1b1b7'} onFocus={takeSnapshot} onChange={(e) => updateEdgeColor(e.target.value)} style={{ width: '100%', padding: '0', border: 'none', height: '30px' }}/></div>
                                <div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>{texts.cable_type}</label><select value={selectedEdge.type || 'smoothstep'} onFocus={takeSnapshot} onChange={(e) => updateEdgeType(e.target.value)} style={{ width: '100%', padding: '5px' }}><option value="smoothstep">{texts.cable_type_smoothstep}</option><option value="step">{texts.cable_type_step}</option><option value="straight">{texts.cable_type_straight}</option></select></div>
                                <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}><input type="checkbox" id="hasArrow" checked={!!selectedEdge.markerEnd} onFocus={takeSnapshot} onChange={(e) => updateEdgeArrow(e.target.checked)} /><label htmlFor="hasArrow" style={{ fontSize: '12px', opacity: 0.7 }}>{texts.cable_arrow}</label></div>
                              </>
                          )}
                          {selectedNode && selectedNode.type !== 'wall' && selectedNode.type !== 'group' && (<div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>{texts.name_label}</label><input type="text" value={selectedNode.data?.label || ''} onFocus={takeSnapshot} onChange={(e) => updateNodeData('label', e.target.value)} style={{ width: '100%', padding: '5px' }}/></div>)}
                          {selectedNode && ['light', 'spotlight', 'wall_light', 'socket', 'socket_double', 'socket_triple', 'switch', 'switch_two_way', 'push_button', 'breaker', 'rj45', 'thermostat', 'camera'].includes(selectedNode.type) && (
                              <div style={{ marginBottom: '10px', padding: '10px', background: 'var(--item-bg)', border: '1px solid var(--item-border)', borderRadius: '4px' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: '#007bff', fontWeight: 'bold', marginBottom: '5px' }}>{texts.circuit_name}</label>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                  <input list="circuit-suggestions" type="text" value={selectedNode.data?.circuit || ''} onFocus={takeSnapshot} onChange={(e) => updateNodeData('circuit', e.target.value.toUpperCase())} style={{ width: '100%', padding: '5px', border: '1px solid #007bff', outline: 'none' }}/>
                                  <datalist id="circuit-suggestions">{existingCircuits.map(c => <option key={c} value={c} />)}</datalist>
                                  <button onClick={handleSuggestNewCircuit} title="Nouveau circuit">N</button>
                                  <button onClick={handleSuggestSubCircuit} title="Sous-circuit" disabled={!selectedNode.data?.circuit}>S</button>
                                </div>
                              </div>
                          )}
                          {selectedNode && selectedNode.type === 'breaker' && (<div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>{texts.amperage}</label><input type="text" value={selectedNode.data?.amperage || ''} onFocus={takeSnapshot} onChange={(e) => updateNodeData('amperage', e.target.value)} style={{ width: '100%', padding: '5px' }}/></div>)}
                          {selectedNode && ['light', 'spotlight', 'wall_light', 'socket', 'socket_double', 'socket_triple', 'door', 'window', 'switch', 'switch_two_way', 'push_button', 'rj45', 'thermostat', 'camera'].includes(selectedNode.type) && (<div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>{texts.rotation}</label><input type="number" step="90" value={selectedNode.data?.rotation || 0} onFocus={takeSnapshot} onChange={(e) => updateNodeData('rotation', parseInt(e.target.value, 10) || 0)} style={{ width: '100%', padding: '5px' }}/></div>)}
                          {selectedNode && selectedNode.type === 'wall' && (<><div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>{texts.wall_length}</label><input type="number" value={selectedNode.style?.width > selectedNode.style?.height ? selectedNode.style?.width : selectedNode.style?.height || 0} onFocus={takeSnapshot} onChange={(e) => updateNodeStyle(selectedNode.style?.width > selectedNode.style?.height ? 'width' : 'height', parseInt(e.target.value, 10) || 15)} style={{ width: '100%', padding: '5px' }}/></div><div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>{texts.wall_thickness}</label><input type="number" value={selectedNode.style?.width > selectedNode.style?.height ? selectedNode.style?.height : selectedNode.style?.width || 0} onFocus={takeSnapshot} onChange={(e) => updateNodeStyle(selectedNode.style?.width > selectedNode.style?.height ? 'height' : 'width', parseInt(e.target.value, 10) || 15)} style={{ width: '100%', padding: '5px' }}/></div></>)}
                          {selectedNode && selectedNode.type === 'text' && (<div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>{texts.font_size}</label><input type="number" value={selectedNode.data?.fontSize || 20} onFocus={takeSnapshot} onChange={(e) => updateNodeData('fontSize', parseInt(e.target.value, 10) || 20)} style={{ width: '100%', padding: '5px' }}/></div>)}
                          {selectedNode && ['wall', 'room', 'text'].includes(selectedNode.type) && (<div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>{texts.color}</label><input type="color" value={selectedNode.data?.color || '#333333'} onFocus={takeSnapshot} onChange={(e) => updateNodeData('color', e.target.value)} style={{ width: '100%', padding: '0', border: 'none', height: '30px' }}/></div>)}
                          {selectedNode && (<div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid var(--border)' }}><input type="checkbox" id="lockPos" checked={selectedNode.draggable === false} onFocus={takeSnapshot} onChange={(e) => updateNodeProperty('draggable', !e.target.checked)} /><label htmlFor="lockPos" style={{ fontSize: '12px', opacity: 0.7 }}>{texts.lock}</label></div>)}
                        </>
                    ) : (
                        <>
                          <h3 style={{ marginBottom: '20px' }}>{texts.project_settings}</h3>
                          <div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>{texts.project_name}</label><input type="text" value={projectData.projectName || ''} onFocus={takeSnapshot} onChange={(e) => setProjectData(pd => ({...pd, projectName: e.target.value}))} style={{ width: '100%', padding: '5px' }} /></div>
                          <div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>{texts.client_name}</label><input type="text" value={projectData.clientName || ''} onFocus={takeSnapshot} onChange={(e) => setProjectData(pd => ({...pd, clientName: e.target.value}))} style={{ width: '100%', padding: '5px' }} /></div>
                          <div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>{texts.client_address}</label><input type="text" value={projectData.clientAddress || ''} onFocus={takeSnapshot} onChange={(e) => setProjectData(pd => ({...pd, clientAddress: e.target.value}))} style={{ width: '100%', padding: '5px' }} /></div>
                          <div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>{texts.installer_name}</label><input type="text" value={projectData.installerName || ''} onFocus={takeSnapshot} onChange={(e) => setProjectData(pd => ({...pd, installerName: e.target.value}))} style={{ width: '100%', padding: '5px' }} /></div>
                          <div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>{texts.date}</label><input type="date" value={projectData.date || ''} onFocus={takeSnapshot} onChange={(e) => setProjectData(pd => ({...pd, date: e.target.value}))} style={{ width: '100%', padding: '5px' }} /></div>
                          <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}><input type="checkbox" id="showCartouche" checked={!!projectData.showCartouche} onFocus={takeSnapshot} onChange={(e) => setProjectData(pd => ({...pd, showCartouche: e.target.checked}))} /><label htmlFor="showCartouche" style={{ fontSize: '12px', opacity: 0.7 }}>{texts.show_cartouche}</label></div>
                          <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}><input type="checkbox" id="showDimensions" checked={!!projectData.showDimensions} onFocus={takeSnapshot} onChange={(e) => setProjectData(pd => ({...pd, showDimensions: e.target.checked}))} /><label htmlFor="showDimensions" style={{ fontSize: '12px', opacity: 0.7 }}>{texts.show_dimensions}</label></div>
                          <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}><input type="checkbox" id="showLegend" checked={!!projectData.showLegend} onFocus={takeSnapshot} onChange={(e) => setProjectData(pd => ({...pd, showLegend: e.target.checked}))} /><label htmlFor="showLegend" style={{ fontSize: '12px', opacity: 0.7 }}>{texts.show_legend}</label></div>
                          <div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>{texts.canvas_bg_color}</label><input type="color" value={projectData.canvasBgColor || '#f0f0f0'} onFocus={takeSnapshot} onChange={(e) => setProjectData(pd => ({...pd, canvasBgColor: e.target.value}))} style={{ width: '100%', padding: '0', border: 'none', height: '30px' }} /></div>
                          <div style={{ marginBottom: '10px', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid var(--border)' }}><label style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginBottom: '5px', fontWeight: 'bold' }}>{texts.import_plan}</label><input type="file" accept="image/*" onChange={handleImageUpload} style={{ width: '100%', fontSize: '12px' }} /></div>
                          <div style={{ marginBottom: '10px', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid var(--border)' }}><h4 style={{ margin: '0 0 10px 0', fontSize: '13px' }}>{texts.bill_of_materials}</h4>{Object.keys(materialCounts).length === 0 ? (<div style={{ fontSize: '12px', opacity: 0.6, fontStyle: 'italic' }}>{texts.empty_materials}</div>) : (<><ul style={{ listStyleType: 'none', padding: 0, margin: 0, fontSize: '12px', marginBottom: '10px' }}>{Object.entries(materialCounts).map(([type, count]) => (
                              <li key={type} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', borderBottom: '1px dashed var(--item-border)', paddingBottom: '3px' }}>
                                <span>{texts[type]}</span>
                                <span style={{ fontWeight: 'bold' }}>x{count}</span>
                              </li>
                          ))}</ul><button onClick={() => exportToCSV(materialCounts)} style={{ width: '100%', padding: '8px', background: 'var(--item-hover)', border: '1px solid var(--item-border)', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px', color: 'var(--text-color)' }}>{texts.export_csv}</button></>)}</div>
                        </>
                    )}
                  </div>
              )}
            </div>
          </StandardContext.Provider>
      );
      default: return <Home onStartEditor={() => setCurrentPage('editor')} onLoginClick={() => setCurrentPage('auth')} texts={texts} onFeaturesClick={() => setCurrentPage('features')} onPricingClick={() => setCurrentPage('pricing')} lang={lang} setLang={setLang} />;
    }
  };

  return renderPage();
}

export default function App() {
  return (
      <ReactFlowProvider>
        <Editor />
      </ReactFlowProvider>
  );
}