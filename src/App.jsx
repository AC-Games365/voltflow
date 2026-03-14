import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import ReactFlow, { 
  ReactFlowProvider,
  Background, 
  Controls,
  useEdgesState,
  Panel,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Hooks personnalisés
import { useUndoRedo } from './hooks/useUndoRedo.js';
import { useFileHandlers } from './hooks/useFileHandlers.js';
import { useWallDrawer } from './hooks/useWallDrawer.js';
import { useNodeManagement } from './hooks/useNodeManagement.js';

// Composants
import Sidebar from './Sidebar.jsx';
import SettingsModal from './SettingsModal.jsx';
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

const nodeTypes = {
  light: LightNode, socket: SocketNode, socket_double: DoubleSocketNode, socket_triple: TripleSocketNode,
  wall: WallNode, room: RoomNode, door: DoorNode, window: WindowNode, panel: PanelNode,
  breaker: BreakerNode, switch: SwitchNode, junction_box: JunctionBoxNode, spotlight: SpotLightNode,
  wall_light: WallLightNode, text: TextNode, image: ImageNode, rj45: Rj45Node, thermostat: ThermostatNode,
};

const initialPlan = {
  nodes: [],
  edges: [],
  projectData: {
    projectName: '', clientName: '', clientAddress: '', installerName: '',
    date: new Date().toISOString().split('T')[0],
    showCartouche: false, showDimensions: true, showLegend: true, canvasBgColor: '#f0f0f0'
  }
};

const getSavedPlan = () => {
  const saved = localStorage.getItem('voltflow-plan');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      const projectData = { ...initialPlan.projectData, ...(parsed.projectData || {}) };
      return { ...initialPlan, ...parsed, projectData };
    } catch (e) { /* ignore */ }
  }
  return initialPlan;
};

function Editor() {
  const reactFlowWrapper = useRef(null);
  const [lang, setLang] = useState('fr');
  const [theme, setTheme] = useState(localStorage.getItem('voltflow-theme') || 'light');
  const texts = t[lang];

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('plan');
  const [isDrawingWall, setIsDrawingWall] = useState(false);

  const { state, setState, takeSnapshot, undo, redo, canUndo, canRedo } = useUndoRedo(getSavedPlan());
  const { nodes, edges, projectData } = state;

  const setNodes = useCallback((newNodes) => setState(cs => ({ ...cs, nodes: typeof newNodes === 'function' ? newNodes(cs.nodes) : newNodes })), [setState]);
  const setEdges = useCallback((newEdges) => setState(cs => ({ ...cs, edges: typeof newEdges === 'function' ? newEdges(cs.edges) : newEdges })), [setState]);
  const setProjectData = useCallback((newProjectData) => setState(cs => ({ ...cs, projectData: typeof newProjectData === 'function' ? newProjectData(cs.projectData) : newProjectData })), [setState]);

  const selectedNodes = useMemo(() => nodes.filter(n => n.selected), [nodes]);
  const selectedNode = useMemo(() => selectedNodes.length === 1 ? selectedNodes[0] : null, [selectedNodes]);
  const selectedEdges = useMemo(() => edges.filter(e => e.selected), [edges]);
  const selectedEdge = useMemo(() => selectedEdges.length === 1 ? selectedEdges[0] : null, [selectedEdges]);

  const { onNodesChange, onConnect, onDrop, updateNodeData, updateNodeProperty, updateNodeStyle, updateEdgeLabel, updateEdgeColor, updateEdgeArrow, updateEdgeType, onGroup, onUngroup, onDuplicate } = useNodeManagement({ setNodes, setEdges, takeSnapshot, selectedNodes, selectedNode, selectedEdge });
  const { onPaneClick, onPaneMouseMove } = useWallDrawer({ isDrawingWall, setIsDrawingWall, setNodes, takeSnapshot, texts });
  const { onExportImage, onSave, onClear, onExportJSON, onImportJSON, exportToCSV, handleImageUpload } = useFileHandlers({ ...state, setNodes, setEdges, setProjectData, takeSnapshot, reactFlowWrapper, texts, lang });

  const materialCounts = useMemo(() => {
    const counts = {};
    const electricalTypes = ['light', 'spotlight', 'wall_light', 'socket', 'socket_double', 'socket_triple', 'switch', 'junction_box', 'breaker', 'panel', 'rj45', 'thermostat'];
    nodes.forEach(node => {
      if (electricalTypes.includes(node.type)) counts[node.type] = (counts[node.type] || 0) + 1;
    });
    return counts;
  }, [nodes]);

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

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', cursor: isDrawingWall ? 'crosshair' : 'default', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
      {isSidebarOpen && (
        <Sidebar lang={lang} setLang={setLang} texts={texts} isDrawingWall={isDrawingWall} setIsDrawingWall={setIsDrawingWall} onExportImage={onExportImage} onSave={onSave} onClear={onClear} onExportJSON={onExportJSON} onImportJSON={onImportJSON} viewMode={viewMode} theme={theme} setTheme={setTheme} onSettingsClick={() => setIsSettingsModalOpen(true)} />
      )}

      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} theme={theme} setTheme={setTheme} lang={lang} setLang={setLang} texts={texts} />

      <div className={projectData.showDimensions === false ? "hide-room-dimensions" : ""} style={{ flexGrow: 1, background: projectData.canvasBgColor || 'var(--bg-color)', position: 'relative' }} ref={reactFlowWrapper}>
        <button className="no-print" onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ position: 'absolute', top: '15px', left: '15px', zIndex: 10, ...toggleButtonStyle }} title={isSidebarOpen ? "Fermer la boîte à outils" : "Ouvrir la boîte à outils"}>
          {isSidebarOpen ? '⬅️' : '➡️ 🛠️'}
        </button>
        <button className="no-print" onClick={() => setIsPropertiesOpen(!isPropertiesOpen)} style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 10, ...toggleButtonStyle }} title={isPropertiesOpen ? "Fermer les propriétés" : "Ouvrir les propriétés"}>
          {isPropertiesOpen ? '➡️' : '📝 ⬅️'}
        </button>
        
        <div className="no-print" style={{ position: 'absolute', top: '15px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', gap: '15px', background: 'var(--panel-bg)', padding: '5px 10px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', alignItems: 'center', border: '1px solid var(--border)' }}>
          <button onClick={() => setViewMode('plan')} style={{ padding: '5px 15px', borderRadius: '4px', border: 'none', background: viewMode === 'plan' ? 'var(--button-primary-bg)' : 'transparent', color: viewMode === 'plan' ? '#fff' : 'var(--text-color)', fontWeight: 'bold', cursor: 'pointer' }}>{texts.view_plan}</button>
          <button onClick={() => setViewMode('unifilaire')} style={{ padding: '5px 15px', borderRadius: '4px', border: 'none', background: viewMode === 'unifilaire' ? 'var(--button-primary-bg)' : 'transparent', color: viewMode === 'unifilaire' ? '#fff' : 'var(--text-color)', fontWeight: 'bold', cursor: 'pointer' }}>{texts.view_unifilaire}</button>
          <div style={{ width: '1px', height: '24px', background: 'var(--border)' }}></div>
          <button onClick={undo} disabled={!canUndo} style={{ background: 'var(--item-bg)', border: '1px solid var(--border)', color: 'var(--text-color)', borderRadius: '4px', padding: '5px 10px', cursor: !canUndo ? 'not-allowed' : 'pointer', fontWeight: 'bold', opacity: !canUndo ? 0.5 : 1 }} title="Annuler (Ctrl+Z)">{texts.undo}</button>
          <button onClick={redo} disabled={!canRedo} style={{ background: 'var(--item-bg)', border: '1px solid var(--border)', color: 'var(--text-color)', borderRadius: '4px', padding: '5px 10px', cursor: !canRedo ? 'not-allowed' : 'pointer', fontWeight: 'bold', opacity: !canRedo ? 0.5 : 1 }} title="Rétablir (Ctrl+Y)">{texts.redo}</button>
        </div>

        <ReactFlow 
          nodes={nodes} 
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={setEdges}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          nodeTypes={nodeTypes}
          onPaneClick={onPaneClick}
          onPaneMouseMove={onPaneMouseMove}
          nodesDraggable={viewMode === 'plan'}
          nodesConnectable={viewMode === 'plan'}
          elementsSelectable={viewMode === 'plan'}
          snapToGrid={true}
          snapGrid={[15, 15]}
          fitView
        >
          <Background variant="dots" color={theme === 'dark' ? '#555' : '#ccc'} gap={15} size={2} />
          <Controls />
          {projectData.showCartouche && (
            <Panel position="bottom-right" style={{ background: 'var(--panel-bg)', color: 'var(--text-color)', border: '2px solid var(--panel-border)', padding: '15px', fontSize: '12px', width: '250px', borderRadius: '4px', pointerEvents: 'none' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '5px', marginBottom: '10px', textTransform: 'uppercase' }}>
                {projectData.projectName || (lang === 'fr' ? 'PLAN ÉLECTRIQUE' : 'ELECTRICAL PLAN')}
              </div>
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

      {isPropertiesOpen && (
        <div className="no-print" style={{ width: '250px', background: 'var(--sidebar-bg)', color: 'var(--text-color)', borderLeft: '1px solid var(--sidebar-border)', padding: '15px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {selectedNodes.length > 1 ? (
            <>
              <h3 style={{ marginBottom: '20px' }}>{texts.multi_selection} ({selectedNodes.length})</h3>
              <button onClick={onGroup} style={{ width: '100%', padding: '10px', background: 'var(--item-hover)', color: 'var(--text-color)', border: '1px solid var(--item-border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px' }}>
                {texts.group}
              </button>
              <button onClick={onDuplicate} style={{ width: '100%', padding: '10px', background: 'var(--item-hover)', color: 'var(--text-color)', border: '1px solid var(--item-border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                {texts.duplicate}
              </button>
            </>
          ) : selectedNode || selectedEdge ? (
            <>
              <h3 style={{ marginBottom: '20px' }}>{texts.properties}</h3>
            
            {selectedNode && selectedNode.type === 'group' && (
              <button onClick={onUngroup} style={{ width: '100%', padding: '10px', background: 'var(--item-hover)', color: 'var(--text-color)', border: '1px solid var(--item-border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '15px' }}>
                {texts.ungroup}
              </button>
            )}
            
            {selectedNode && (
              <button onClick={onDuplicate} style={{ width: '100%', padding: '10px', background: 'var(--item-hover)', color: 'var(--text-color)', border: '1px solid var(--item-border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '15px' }}>
                {texts.duplicate}
              </button>
            )}

            {selectedEdge && (
              <>
                <div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>{texts.cable_section}</label><input type="text" value={selectedEdge.label || ''} onFocus={takeSnapshot} onChange={(e) => updateEdgeLabel(e.target.value)} style={{ width: '100%', padding: '5px', boxSizing: 'border-box' }}/></div>
                <div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>{texts.cable_color}</label><input type="color" value={selectedEdge.style?.stroke || '#b1b1b7'} onFocus={takeSnapshot} onChange={(e) => updateEdgeColor(e.target.value)} style={{ width: '100%', padding: '0', boxSizing: 'border-box', border: 'none', height: '30px', cursor: 'pointer' }}/></div>
                <div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>{texts.cable_type}</label><select value={selectedEdge.type || 'smoothstep'} onFocus={takeSnapshot} onChange={(e) => updateEdgeType(e.target.value)} style={{ width: '100%', padding: '5px', boxSizing: 'border-box' }}><option value="smoothstep">{texts.cable_type_smoothstep}</option><option value="step">{texts.cable_type_step}</option><option value="straight">{texts.cable_type_straight}</option></select></div>
                <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}><input type="checkbox" id="hasArrow" checked={!!selectedEdge.markerEnd} onFocus={takeSnapshot} onChange={(e) => updateEdgeArrow(e.target.checked)} /><label htmlFor="hasArrow" style={{ fontSize: '12px', opacity: 0.7, cursor: 'pointer', userSelect: 'none' }}>{texts.cable_arrow}</label></div>
              </>
            )}
  
            {selectedNode && selectedNode.type !== 'wall' && selectedNode.type !== 'group' && (<div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>{texts.name_label}</label><input type="text" value={selectedNode.data?.label || ''} onFocus={takeSnapshot} onChange={(e) => updateNodeData('label', e.target.value)} style={{ width: '100%', padding: '5px', boxSizing: 'border-box' }}/></div>)}
            
            {selectedNode && ['light', 'spotlight', 'wall_light', 'socket', 'socket_double', 'socket_triple', 'switch', 'breaker'].includes(selectedNode.type) && (<div style={{ marginBottom: '10px', padding: '10px', background: 'var(--item-bg)', border: '1px solid var(--item-border)', borderRadius: '4px' }}><label style={{ display: 'block', fontSize: '12px', color: '#007bff', fontWeight: 'bold', marginBottom: '5px' }}>{texts.circuit_name}</label><input type="text" value={selectedNode.data?.circuit || ''} onFocus={takeSnapshot} onChange={(e) => updateNodeData('circuit', e.target.value.toUpperCase())} style={{ width: '100%', padding: '5px', boxSizing: 'border-box', border: '1px solid #007bff', outline: 'none' }}/></div>)}
  
            {selectedNode && selectedNode.type === 'breaker' && (<div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>{texts.amperage}</label><input type="text" value={selectedNode.data?.amperage || ''} onFocus={takeSnapshot} onChange={(e) => updateNodeData('amperage', e.target.value)} style={{ width: '100%', padding: '5px', boxSizing: 'border-box' }}/></div>)}
  
            {selectedNode && ['light', 'spotlight', 'wall_light', 'socket', 'socket_double', 'socket_triple', 'door', 'window', 'switch', 'rj45', 'thermostat'].includes(selectedNode.type) && (<div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>{texts.rotation}</label><input type="number" step="90" value={selectedNode.data?.rotation || 0} onFocus={takeSnapshot} onChange={(e) => updateNodeData('rotation', parseInt(e.target.value, 10) || 0)} style={{ width: '100%', padding: '5px', boxSizing: 'border-box' }}/></div>)}
  
            {selectedNode && selectedNode.type === 'wall' && (<><div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>{texts.wall_length}</label><input type="number" value={selectedNode.style?.width > selectedNode.style?.height ? selectedNode.style?.width : selectedNode.style?.height || 0} onFocus={takeSnapshot} onChange={(e) => updateNodeStyle(selectedNode.style?.width > selectedNode.style?.height ? 'width' : 'height', parseInt(e.target.value, 10) || 15)} style={{ width: '100%', padding: '5px', boxSizing: 'border-box' }}/></div><div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>{texts.wall_thickness}</label><input type="number" value={selectedNode.style?.width > selectedNode.style?.height ? selectedNode.style?.height : selectedNode.style?.width || 0} onFocus={takeSnapshot} onChange={(e) => updateNodeStyle(selectedNode.style?.width > selectedNode.style?.height ? 'height' : 'width', parseInt(e.target.value, 10) || 15)} style={{ width: '100%', padding: '5px', boxSizing: 'border-box' }}/></div></>)}
            
            {selectedNode && selectedNode.type === 'text' && (<div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>{texts.font_size}</label><input type="number" value={selectedNode.data?.fontSize || 20} onFocus={takeSnapshot} onChange={(e) => updateNodeData('fontSize', parseInt(e.target.value, 10) || 20)} style={{ width: '100%', padding: '5px', boxSizing: 'border-box' }}/></div>)}
  
            {selectedNode && ['wall', 'room', 'text'].includes(selectedNode.type) && (<div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>{selectedNode.type === 'text' ? texts.text_color : texts.bg_color}</label><input type="color" value={selectedNode.data?.color || '#333333'} onFocus={takeSnapshot} onChange={(e) => updateNodeData('color', e.target.value)} style={{ width: '100%', padding: '0', boxSizing: 'border-box', border: 'none', height: '30px', cursor: 'pointer' }}/></div>)}
            
            {selectedNode && (<div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid var(--border)' }}><input type="checkbox" id="lockPos" checked={selectedNode.draggable === false} onFocus={takeSnapshot} onChange={(e) => updateNodeProperty('draggable', !e.target.checked)} /><label htmlFor="lockPos" style={{ fontSize: '12px', opacity: 0.7, cursor: 'pointer', userSelect: 'none' }}>{texts.lock}</label></div>)}
            </>
          ) : (
            <>
              <h3 style={{ marginBottom: '20px' }}>{texts.project_settings}</h3>
              <div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>{texts.project_name}</label><input type="text" value={projectData.projectName || ''} onFocus={takeSnapshot} onChange={(e) => setProjectData(pd => ({...pd, projectName: e.target.value}))} style={{ width: '100%', padding: '5px', boxSizing: 'border-box' }} /></div>
              <div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>{texts.client_name}</label><input type="text" value={projectData.clientName || ''} onFocus={takeSnapshot} onChange={(e) => setProjectData(pd => ({...pd, clientName: e.target.value}))} style={{ width: '100%', padding: '5px', boxSizing: 'border-box' }} /></div>
              <div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>{texts.client_address}</label><input type="text" value={projectData.clientAddress || ''} onFocus={takeSnapshot} onChange={(e) => setProjectData(pd => ({...pd, clientAddress: e.target.value}))} style={{ width: '100%', padding: '5px', boxSizing: 'border-box' }} /></div>
              <div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>{texts.installer_name}</label><input type="text" value={projectData.installerName || ''} onFocus={takeSnapshot} onChange={(e) => setProjectData(pd => ({...pd, installerName: e.target.value}))} style={{ width: '100%', padding: '5px', boxSizing: 'border-box' }} /></div>
              <div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>{texts.date}</label><input type="date" value={projectData.date || ''} onFocus={takeSnapshot} onChange={(e) => setProjectData(pd => ({...pd, date: e.target.value}))} style={{ width: '100%', padding: '5px', boxSizing: 'border-box' }} /></div>
              <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}><input type="checkbox" id="showCartouche" checked={!!projectData.showCartouche} onFocus={takeSnapshot} onChange={(e) => setProjectData(pd => ({...pd, showCartouche: e.target.checked}))} /><label htmlFor="showCartouche" style={{ fontSize: '12px', opacity: 0.7, cursor: 'pointer', userSelect: 'none' }}>{texts.show_cartouche}</label></div>
              <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}><input type="checkbox" id="showDimensions" checked={!!projectData.showDimensions} onFocus={takeSnapshot} onChange={(e) => setProjectData(pd => ({...pd, showDimensions: e.target.checked}))} /><label htmlFor="showDimensions" style={{ fontSize: '12px', opacity: 0.7, cursor: 'pointer', userSelect: 'none' }}>{texts.show_dimensions}</label></div>
              <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}><input type="checkbox" id="showLegend" checked={!!projectData.showLegend} onFocus={takeSnapshot} onChange={(e) => setProjectData(pd => ({...pd, showLegend: e.target.checked}))} /><label htmlFor="showLegend" style={{ fontSize: '12px', opacity: 0.7, cursor: 'pointer', userSelect: 'none' }}>{texts.show_legend}</label></div>
              <div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>{texts.canvas_bg_color}</label><input type="color" value={projectData.canvasBgColor || '#f0f0f0'} onFocus={takeSnapshot} onChange={(e) => setProjectData(pd => ({...pd, canvasBgColor: e.target.value}))} style={{ width: '100%', padding: '0', boxSizing: 'border-box', border: 'none', height: '30px', cursor: 'pointer' }} /></div>
              <div style={{ marginBottom: '10px', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid var(--border)' }}><label style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginBottom: '5px', fontWeight: 'bold' }}>{texts.import_plan}</label><input type="file" accept="image/png, image/jpeg, image/jpg, image/webp" onChange={handleImageUpload} style={{ width: '100%', fontSize: '12px', cursor: 'pointer' }} /></div>
              <div style={{ marginBottom: '10px', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid var(--border)' }}><h4 style={{ margin: '0 0 10px 0', fontSize: '13px' }}>{texts.bill_of_materials}</h4>{Object.keys(materialCounts).length === 0 ? (<div style={{ fontSize: '12px', opacity: 0.6, fontStyle: 'italic' }}>{texts.empty_materials}</div>) : (<><ul style={{ listStyleType: 'none', padding: 0, margin: 0, fontSize: '12px', marginBottom: '10px' }}>{Object.entries(materialCounts).map(([type, count]) => (<li key={type} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', borderBottom: '1px dashed var(--item-border)', paddingBottom: '3px' }}><span>{texts[type]}</span><span style={{ fontWeight: 'bold' }}>x{count}</span></li>))}</ul><button onClick={() => exportToCSV(materialCounts)} style={{ width: '100%', padding: '8px', background: 'var(--item-hover)', border: '1px solid var(--item-border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', color: 'var(--text-color)' }}>{texts.export_csv}</button></>)}</div>
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