import React, { useRef } from 'react';

export default function Sidebar({ 
  lang, setLang, texts, isDrawingWall, setIsDrawingWall, 
  onExportImage, onPrint, onSave, onClear, onExportJSON, 
  onImportJSON, onExportPDF, viewMode, sidebarItems, moveSidebarItem,
  theme, setTheme, onSettingsClick, activeCircuit
}) {

  const importInputRef = useRef(null);

  // Fonction pour le drag & drop vers le canvas
  const onDragStart = (event, nodeType, label, orientation = 'horizontal') => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/reactflow-label', label);
    event.dataTransfer.setData('application/reactflow-orientation', orientation);
    event.dataTransfer.effectAllowed = 'move';
  };

  const itemStyle = { 
    border: '1px solid var(--item-border)', 
    padding: '10px', 
    marginBottom: '10px', 
    cursor: 'grab', 
    borderRadius: '4px',
    background: 'var(--item-bg)',
    color: 'var(--text-color)',
    textAlign: 'left',
    paddingLeft: '15px'
  };

  const summaryStyle = {
    fontWeight: 'bold',
    padding: '8px',
    backgroundColor: 'var(--sidebar-bg)',
    border: '1px solid var(--sidebar-border)',
    borderRadius: '4px',
    cursor: 'pointer',
    marginBottom: '5px',
    userSelect: 'none',
    fontSize: '13px',
    color: 'var(--text-color)',
    textAlign: 'left',
    paddingLeft: '10px'
  };

  const detailsStyle = { marginBottom: '15px' };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  return (
    <aside className="no-print" style={{ display: 'flex', flexDirection: 'column', width: '250px', background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)', padding: '15px', color: 'var(--text-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ margin: 0 }}>{texts.toolbox}</h3>
        <button onClick={onSettingsClick} style={{ background: 'transparent', border: '1px solid var(--item-border)', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px', fontSize: '18px' }} title={texts.settings_title}>
          ⚙️
        </button>
      </div>

      {activeCircuit && (
        <div style={{ padding: '5px 8px', background: 'var(--item-hover)', border: '1px solid var(--item-border)', borderRadius: '4px', fontSize: '12px', marginBottom: '10px', textAlign: 'center' }}>
          Circuit Actif : <strong style={{ color: 'var(--button-primary-bg)' }}>{activeCircuit}</strong>
        </div>
      )}

      <p style={{ fontSize: '12px', color: 'var(--text-color)', opacity: 0.8, marginBottom: '15px', textAlign: 'left' }}>
        {texts.drag_drop}
      </p>

      <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '5px' }}>
        {viewMode === 'plan' ? (
          <>
            {/* CATEGORIE ARCHITECTURE */}
            <details style={detailsStyle}>
              <summary style={summaryStyle}>{texts.cat_architecture}</summary>
              <div style={{ paddingTop: '5px' }}>
                <div onClick={() => setIsDrawingWall(!isDrawingWall)} style={{...itemStyle, background: isDrawingWall ? 'var(--button-primary-bg)' : 'var(--item-bg)', color: isDrawingWall ? '#fff' : 'var(--text-color)', border: '3px solid var(--text-color)', textAlign: 'center'}}>
                  {isDrawingWall ? texts.cancel_draw : texts.draw_wall}
                </div>
                
                {sidebarItems && sidebarItems.map((item, index) => (
                   item.type === 'room' && (
                     <div key={index} onDragStart={(event) => onDragStart(event, 'room', texts.new_room)} draggable style={{...itemStyle, background: theme === 'dark' ? '#004d40' : '#e0f7fa', border: '2px dashed #009688'}}>
                       {texts.room}
                     </div>
                   )
                ))}

                <div onDragStart={(event) => onDragStart(event, 'door', texts.door)} draggable style={{...itemStyle, borderStyle: 'dashed'}}>
                  {texts.door}
                </div>
                <div onDragStart={(event) => onDragStart(event, 'window', texts.window)} draggable style={{...itemStyle, borderStyle: 'dashed'}}>
                  {texts.window}
                </div>
              </div>
            </details>
              
            {/* CATEGORIE ECLAIRAGE */}
            <details style={detailsStyle}>
              <summary style={summaryStyle}>{texts.cat_lighting}</summary>
              <div style={{ paddingTop: '5px' }}>
                <div onDragStart={(event) => onDragStart(event, 'light', texts.light)} draggable style={itemStyle}>{texts.light}</div>
                <div onDragStart={(event) => onDragStart(event, 'spotlight', texts.spotlight)} draggable style={itemStyle}>{texts.spotlight}</div>
                <div onDragStart={(event) => onDragStart(event, 'wall_light', texts.wall_light)} draggable style={itemStyle}>{texts.wall_light}</div>
              </div>
            </details>

            {/* CATEGORIE PRISES ET INTERRUPTEURS */}
            <details style={detailsStyle}>
              <summary style={summaryStyle}>{texts.cat_sockets_switches}</summary>
              <div style={{ paddingTop: '5px' }}>
                <div onDragStart={(event) => onDragStart(event, 'socket', texts.socket)} draggable style={itemStyle}>{texts.socket}</div>
                <div onDragStart={(event) => onDragStart(event, 'socket_double', texts.socket_double)} draggable style={itemStyle}>{texts.socket_double}</div>
                <div onDragStart={(event) => onDragStart(event, 'socket_triple', texts.socket_triple)} draggable style={itemStyle}>{texts.socket_triple}</div>
                <div onDragStart={(event) => onDragStart(event, 'switch', texts.switch)} draggable style={itemStyle}>{texts.switch}</div>
              </div>
            </details>

            {/* CATEGORIE TABLEAU */}
            <details style={detailsStyle}>
              <summary style={summaryStyle}>{texts.cat_panel}</summary>
              <div style={{ paddingTop: '5px' }}>
                <div onDragStart={(event) => onDragStart(event, 'panel', texts.panel)} draggable style={itemStyle}>{texts.panel}</div>
                <div onDragStart={(event) => onDragStart(event, 'breaker', texts.breaker)} draggable style={itemStyle}>{texts.breaker}</div>
                <div onDragStart={(event) => onDragStart(event, 'junction_box', texts.junction_box)} draggable style={itemStyle}>{texts.junction_box}</div>
              </div>
            </details>
          </>
        ) : (
          /* MODE UNIFILAIRE */
          <div style={{ padding: '15px 5px', color: 'var(--text-color)', fontSize: '13px', textAlign: 'center', marginTop: '20px' }}>
            ⚡<br/>
            {lang === 'fr' 
              ? "Le schéma unifilaire est généré automatiquement." 
              : "Single-line diagram is auto-generated."}
          </div>
        )}
        
        {/* ACTIONS GLOBALES */}
        <details style={detailsStyle} open>
          <summary style={summaryStyle}>{texts.cat_actions}</summary>
          <div style={{ paddingTop: '5px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={onSave} style={{ width: '100%', padding: '8px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>{texts.save_plan}</button>
            <button onClick={handleImportClick} style={{ width: '100%', padding: '8px', background: '#17a2b8', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>{texts.import_project || 'Importer un projet'}</button>
            <input type="file" ref={importInputRef} onChange={onImportJSON} accept=".json" style={{ display: 'none' }} />
            <button onClick={onExportJSON} style={{ width: '100%', padding: '8px', background: '#fd7e14', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>{texts.export_project}</button>
            <button onClick={onExportImage} style={{ width: '100%', padding: '8px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>{texts.export_image}</button>
            <button onClick={onClear} style={{ width: '100%', padding: '8px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>{texts.clear_plan}</button>
          </div>
        </details>
      </div>
    </aside>
  );
}