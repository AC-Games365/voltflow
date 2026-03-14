import { Handle, Position } from 'reactflow';
import { memo } from 'react';

// memoizing the component is a good practice for performance
const LightNode = ({ data }) => {
  const rotation = data?.rotation || 0;
  return (
    <>
      {/* A Handle is a connection point for edges. */}
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      <div style={{ padding: '5px', transform: `rotate(${rotation}deg)`, transition: 'transform 0.2s ease', position: 'relative' }}>
        {data?.circuit && (
          <div style={{ position: 'absolute', top: -8, right: -8, background: '#007bff', color: '#fff', borderRadius: '4px', padding: '2px 4px', fontSize: '10px', fontWeight: 'bold', transform: `rotate(${-rotation}deg)`, pointerEvents: 'none', zIndex: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
            {data.circuit}
          </div>
        )}
        {data?.annotation && (
          <div style={{ position: 'absolute', bottom: -12, right: -12, background: 'rgba(255, 255, 255, 0.9)', color: '#333', border: '1px solid #aaa', borderRadius: '3px', padding: '1px 4px', fontSize: '9px', fontWeight: 'bold', transform: `rotate(${-rotation}deg)`, pointerEvents: 'none', zIndex: 10, whiteSpace: 'nowrap', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
            {data.annotation}
          </div>
        )}
        <svg width="40" height="40" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" stroke="black" strokeWidth="5" fill="white" />
          <line x1="15" y1="15" x2="85" y2="85" stroke="black" strokeWidth="5" />
          <line x1="85" y1="15" x2="15" y2="85" stroke="black" strokeWidth="5" />
        </svg>
      </div>
      {/* The label is displayed below the symbol */}
      <div style={{ fontSize: '12px', textAlign: 'center', padding: '0 5px 5px 5px' }}>{data.label}</div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </>
  );
};

export default memo(LightNode);