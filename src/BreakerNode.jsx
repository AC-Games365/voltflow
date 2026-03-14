import { memo } from 'react';
import { Handle, Position } from 'reactflow';

const BreakerNode = ({ data, selected }) => {
  return (
    <div style={{ width: '40px', height: '60px', background: '#fff', border: '2px solid #333', borderRadius: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', outline: selected ? '2px dashed #007bff' : 'none' }}>
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      
      {data?.annotation && (
        <div style={{ position: 'absolute', bottom: -12, right: -12, background: 'rgba(255, 255, 255, 0.9)', color: '#333', border: '1px solid #aaa', borderRadius: '3px', padding: '1px 4px', fontSize: '9px', fontWeight: 'bold', pointerEvents: 'none', zIndex: 10, whiteSpace: 'nowrap', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
          {data.annotation}
        </div>
      )}

      {/* Levier du disjoncteur */}
      <div style={{ width: '16px', height: '8px', background: '#28a745', borderRadius: '2px', marginBottom: '4px' }} />
      
      <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#333' }}>{data.amperage || '16A'}</div>
      <div style={{ fontSize: '8px', textAlign: 'center', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', padding: '0 2px' }}>{data.label}</div>
      
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </div>
  );
};

export default memo(BreakerNode);