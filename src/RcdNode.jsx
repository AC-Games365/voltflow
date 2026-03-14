import { memo } from 'react';
import { Handle, Position } from 'reactflow';

const RcdNode = ({ data, selected }) => {
  const rotation = data?.rotation || 0;
  return (
    <div style={{ width: '45px', height: '65px', background: '#fff', border: '2px solid #333', borderRadius: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', outline: selected ? '2px dashed #007bff' : 'none' }}>
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      
      {data?.annotation && (
        <div style={{ position: 'absolute', bottom: -12, right: -12, background: 'rgba(255, 255, 255, 0.9)', color: '#333', border: '1px solid #aaa', borderRadius: '3px', padding: '1px 4px', fontSize: '9px', fontWeight: 'bold', transform: `rotate(${-rotation}deg)`, pointerEvents: 'none', zIndex: 10, whiteSpace: 'nowrap', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
          {data.annotation}
        </div>
      )}

      {/* Bouton de test du différentiel */}
      <div style={{ position: 'absolute', top: '4px', right: '4px', width: '6px', height: '6px', background: '#dc3545', borderRadius: '50%' }} title="Test" />
      
      {/* Levier */}
      <div style={{ width: '18px', height: '8px', background: '#007bff', borderRadius: '2px', marginBottom: '2px', marginTop: '6px' }} />
      
      <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#333' }}>{data.amperage || '40A'}</div>
      <div style={{ fontSize: '9px', color: '#666' }}>{data.sensitivity || '30mA'}</div>
      <div style={{ fontSize: '8px', textAlign: 'center', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', padding: '0 2px' }}>{data.label}</div>
      
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </div>
  );
};

export default memo(RcdNode);