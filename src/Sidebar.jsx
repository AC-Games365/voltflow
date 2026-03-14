import React from 'react';

export default function Sidebar({ lang, setLang, texts, isDrawingWall, setIsDrawingWall, onExportImage, onPrint, onSave, onClear, onExportJSON, onImportJSON, viewMode, sidebarItems, moveSidebarItem }) {
   // Cette fonction est appelée quand on commence à glisser un élément
  const onDragStart = (event, nodeType, label, orientation = 'horizontal') => {
    // On stocke le type de nœud et son label dans l'événement
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/reactflow-label', label);
    event.dataTransfer.setData('application/reactflow-orientation', orientation);
    event.dataTransfer.effectAllowed = 'move';
  };

  const itemStyle = { 
    border: '1px solid #333', 
    padding: '10px', 
    marginBottom: '10px', 
    cursor: 'grab', 
    borderRadius: '4px',
    background: '#fff'
  };

    const getItemStyle = (isDragging, draggableStyle) => ({
    // some basic styles to make the items look a bit nicer
    userSelect: "none",
    padding: 16,
    margin: "0 0 8px 0",
    borderRadius: '4px',
    // change background colour if dragging
    background: isDragging ? "lightgreen" : "white",
    // styles we need to apply on draggables
  const summaryStyle = {
    fontWeight: 'bold',
    padding: '8px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #ccc',
    borderRadius: '4px',
    cursor: 'pointer',
    marginBottom: '5px',
    userSelect: 'none',
    fontSize: '13px'
  };

  const detailsStyle = { marginBottom: '15px' };

  return (
    <aside className="no-print" style={{ display: 'flex', flexDirection: 'column', width: '250px', background: '#fff', borderRight: '1px solid #ccc', padding: '15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0 }}>{texts.toolbox}</h3>

        <div>
          <button onClick={() => setLang('fr')} style={{ color: '#333', padding: '4px 6px', marginRight: '5px', fontWeight: lang === 'fr' ? 'bold' : 'normal', cursor: 'pointer', border: lang === 'fr' ? '1px solid #333' : '1px solid transparent', borderRadius: '4px', background: lang === 'fr' ? '#e0e0e0' : 'transparent' }}>FR</button>
          <button onClick={() => setLang('en')} style={{ color: '#333', padding: '4px 6px', fontWeight: lang === 'en' ? 'bold' : 'normal', cursor: 'pointer', border: lang === 'en' ? '1px solid #333' : '1px solid transparent', borderRadius: '4px', background: lang === 'en' ? '#e0e0e0' : 'transparent' }}>EN</button>
        </div>
      </div>



      <DragDropContext onDragEnd={result => {
      console.log(result);
      const { destination, source, draggableId } = result;

      if (!destination) return;

      moveSidebarItem(source.index, destination.index);
    }}>
      <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>
        {texts.drag_drop}
      </p>

      {/* Conteneur avec défilement (scroll) pour les catégories */}
      <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '5px' }}>
        {viewMode === 'plan' ? (
          <>
            <details style={detailsStyle}>

              <summary style={summaryStyle}>{texts.cat_architecture}</summary>
              <div style={{ paddingTop: '5px' }}>
                <div onClick={() => setIsDrawingWall(!isDrawingWall)} style={{...itemStyle, background: isDrawingWall ? '#007bff' : '#eee', color: isDrawingWall ? '#fff' : '#333', border: '3px solid #333', textAlign: 'center'}}>
                  {isDrawingWall ? texts.cancel_draw : texts.draw_wall}
                </div>

                {sidebarItems.map((item, index) => (

                   item.type === 'room'   &&        <div onDragStart={(event) => onDragStart(event, 'room', texts.new_room)} draggable style={{...itemStyle, background: '#e0f7fa', border: '2px dashed #009688'}}>
                 {texts.room}
                  </div>

                 ))}


                 <div onDragStart={(event) => onDragStart(event, 'door', texts.door)} draggable style={{...itemStyle, borderStyle: 'dashed'}}>
                  {texts.door}
                </div>
                <div onDragStart={(event) => onDragStart(event, 'window', texts.window)} draggable style={{...itemStyle, borderStyle: 'dashed'}}>
                  {texts.window}
                </div>
             <div onDragStart={(event) => onDragStart(event, 'area', 'Zone')} draggable style={{...itemStyle, borderStyle: 'dotted'}}>
              {texts.area}
            </div>
                <div onDragStart={(event) => onDragStart(event, 'text', texts.default_text)} draggable style={{...itemStyle, borderStyle: 'dotted'}}>
                  {texts.text_note}
                </div>
              </div>
            </details>
              
            <details style={detailsStyle}>

              <summary style={summaryStyle}>{texts.cat_lighting}</summary>
              <div style={{ paddingTop: '5px' }}>

        
            {sidebarItems.map((item, index) => (

                   item.type === 'light'   &&          <div onDragStart={(event) => onDragStart(event, 'light', texts.light)} draggable style={itemStyle}>{texts.light}</div>

                ))}

                {sidebarItems.map((item, index) => (

                   item.type === 'spotlight'   &&             <div onDragStart={(event) => onDragStart(event, 'spotlight', texts.spotlight)} draggable style={itemStyle}>{texts.spotlight}</div>
                ))}
               {sidebarItems.map((item, index) => (

                   item.type === 'wall_light'   &&             <div onDragStart={(event) => onDragStart(event, 'wall_light', texts.wall_light)} draggable style={itemStyle}>{texts.wall_light}</div>
                ))}

             
         
            {sidebarItems.map((item, index) => (
       item.type === 'socket'   &&            <div onDragStart={(event) => onDragStart(event, 'socket', texts.socket)} draggable style={itemStyle}>{texts.socket}</div>
                ))}
           
   
            {sidebarItems.map((item, index) => (
                   item.type === 'switch'   &&             <div onDragStart={(event) => onDragStart(event, 'switch', texts.switch)} draggable style={itemStyle}>{texts.switch}</div>
                ))}




         

                <div onDragStart={(event) => onDragStart(event, 'spotlight', texts.spotlight)} draggable style={itemStyle}>{texts.spotlight}</div>
                <div onDragStart={(event) => onDragStart(event, 'wall_light', texts.wall_light)} draggable style={itemStyle}>{texts.wall_light}</div>
              </div>
            </details>

            <details style={detailsStyle}>
              <summary style={summaryStyle}>{texts.cat_sockets_switches}</summary>
              <div style={{ paddingTop: '5px' }}>
         
                <div onDragStart={(event) => onDragStart(event, 'socket_double', texts.socket_double)} draggable style={itemStyle}>{texts.socket_double}</div>
                <div onDragStart={(event) => onDragStart(event, 'socket_triple', texts.socket_triple)} draggable style={itemStyle}>{texts.socket_triple}</div>
                <div onDragStart={(event) => onDragStart(event, 'switch', texts.switch)} draggable style={itemStyle}>{texts.switch}</div>
              </div>
            </details>

            <details style={detailsStyle}>
              <summary style={summaryStyle}>{texts.cat_panel}</summary>
              <div style={{ paddingTop: '5px' }}>
                <div onDragStart={(event) => onDragStart(event, 'panel', texts.panel)} draggable style={itemStyle}>{texts.panel}</div>
              <div onDragStart={(event) => onDragStart(event, 'sub_panel', texts.sub_panel)} draggable style={itemStyle}>{texts.sub_panel}</div>
              <div onDragStart={(event) => onDragStart(event, 'rcd', texts.rcd)} draggable style={itemStyle}>{texts.rcd}</div>
                <div onDragStart={(event) => onDragStart(event, 'breaker', texts.breaker)} draggable style={itemStyle}>{texts.breaker}</div>
                <div onDragStart={(event) => onDragStart(event, 'junction_box', texts.junction_box)} draggable style={itemStyle}>{texts.junction_box}</div>
              </div>
            </details>

            <details style={detailsStyle}>
              <summary style={summaryStyle}>{texts.cat_network}</summary>
              <div style={{ paddingTop: '5px' }}>
                <div onDragStart={(event) => onDragStart(event, 'rj45', texts.rj45)} draggable style={itemStyle}>{texts.rj45}</div>
                <div onDragStart={(event) => onDragStart(event, 'thermostat', texts.thermostat)} draggable style={itemStyle}>{texts.thermostat}</div>
                <div onDragStart={(event) => onDragStart(event, 'camera', texts.camera)} draggable style={itemStyle}>{texts.camera}</div>
              </div>
            </details>
          </>
        ) : (
          <div style={{ padding: '15px 5px', color: '#666', fontSize: '13px', textAlign: 'center', marginTop: '20px', lineHeight: '1.6' }}>
            <span style={{ fontSize: '24px' }}>⚡</span><br/><br/>
            {lang === 'fr' 
              ? "Les outils de dessin ne sont pas disponibles en Mode Unifilaire. Ce schéma est généré automatiquement." 
              : "Drawing tools are not available in Single-line mode. This diagram is automatically generated."}<br/><br/>
            <strong>{lang === 'fr' ? "Repassez en Mode Plan pour modifier l'installation." : "Switch back to Plan Mode to edit the installation."}</strong>
          </div>
        )}
        
        {/* Nouvelle catégorie contenant toutes les actions (fermée par défaut) */}
        <details style={detailsStyle}>
          <summary style={summaryStyle}>{texts.cat_actions}</summary>
          <div style={{ paddingTop: '5px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={onSave} style={{ width: '100%', padding: '8px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
              {texts.save_plan}
            </button>
            <label style={{ width: '100%', padding: '8px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', display: 'block', textAlign: 'center', boxSizing: 'border-box', fontSize: '13px' }}>
              {texts.import_project}
              <input type="file" accept=".json" onChange={onImportJSON} style={{ display: 'none' }} />
            </label>
            <button onClick={onExportJSON} style={{ width: '100%', padding: '8px', background: '#fd7e14', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
              {texts.export_project}
            </button>
            <button onClick={onExportImage} style={{ width: '100%', padding: '8px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
              {texts.export_image}
            </button>
            <button onClick={onExportPDF} style={{ width: '100%', padding: '8px', background: '#e83e8c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
              {texts.export_pdf}
            </button>
            <button onClick={onPrint} style={{ width: '100%', padding: '8px', background: '#17a2b8', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
              {texts.print_plan}
            </button>
            <button onClick={onClear} style={{ width: '100%', padding: '8px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
              {texts.clear_plan}
            </button>
          </div>
        </details>

      </div>
    </aside>
  );
}