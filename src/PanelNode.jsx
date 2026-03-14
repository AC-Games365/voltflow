import { memo } from 'react';
import { NodeResizer } from 'reactflow';

const PanelNode = ({ data, selected }) => {
  return (
    <>
      <NodeResizer color="#333" isVisible={selected} minWidth={150} minHeight={200} />
      <div style={{ width: '100%', height: '100%', backgroundColor: '#e9ecef', border: '3px solid #343a40', borderRadius: '8px', position: 'relative', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
        {/* En-tête du tableau */}
        <div style={{ background: '#343a40', color: '#fff', padding: '5px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px', borderTopLeftRadius: '4px', borderTopRightRadius: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {data.label}
        </div>
        {/* Espace intérieur (Rails DIN) */}
        <div style={{ flexGrow: 1, border: '2px dashed #adb5bd', margin: '10px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <span style={{ color: '#adb5bd', fontSize: '12px', textAlign: 'center' }}>Placer les disjoncteurs ici</span>
        </div>
      </div>
    </>
  );
};

export default memo(PanelNode);