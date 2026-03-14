import { memo } from 'react';
import { Handle, Position } from 'reactflow';

const SwitchNode = ({ data, selected }) => {
  const rotation = data?.rotation || 0;
  return (
    <>
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      <div style={{ padding: '5px', transform: `rotate(${rotation}deg)`, transition: 'transform 0.2s ease', outline: selected ? '2px dashed #007bff' : 'none', position: 'relative' }}>
        {data?.annotation && (
          <div style={{ position: 'absolute', bottom: -12, right: -12, background: 'rgba(255, 255, 255, 0.9)', color: '#333', border: '1px solid #aaa', borderRadius: '3px', padding: '1px 4px', fontSize: '9px', fontWeight: 'bold', transform: `rotate(${-rotation}deg)`, pointerEvents: 'none', zIndex: 10, whiteSpace: 'nowrap', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
            {data.annotation}
          </div>
        )}
        <svg width="40" height="40" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
          {/* Symbole d'un interrupteur va-et-vient (cercle avec deux lignes divergentes) */}
          <circle cx="50" cy="50" r="20" stroke="black" strokeWidth="5" fill="white" />
          <line x1="35" y1="35" x2="15" y2="15" stroke="black" strokeWidth="5" />
          <line x1="65" y1="35" x2="85" y2="15" stroke="black" strokeWidth="5" />
        </svg>
      </div>
      <div style={{ fontSize: '12px', textAlign: 'center', padding: '0 5px 5px 5px' }}>{data.label}</div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </>
  );
};

export default memo(SwitchNode);