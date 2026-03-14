import { memo } from 'react';
import { Handle, Position } from 'reactflow';

const CameraNode = ({ data, selected }) => {
  const rotation = data?.rotation || 0;
  return (
    <>
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      <div style={{ padding: '5px', transform: `rotate(${rotation}deg)`, transition: 'transform 0.2s ease', outline: selected ? '2px dashed #007bff' : 'none' }}>
        <svg width="40" height="40" viewBox="0 0 100 100">
          {/* Camera Symbol */}
          <circle cx="50" cy="50" r="30" stroke="black" strokeWidth="5" fill="white" />
          <circle cx="50" cy="50" r="10" fill="black" />
          <line x1="20" y1="20" x2="80" y2="80" stroke="black" strokeWidth="3" />
          <line x1="80" y1="20" x2="20" y2="80" stroke="black" strokeWidth="3" />
        </svg>
      </div>
      {/* Le label est affiché sous le symbole */}
      <div style={{ fontSize: '12px', textAlign: 'center', padding: '0 5px 5px 5px' }}>{data.label}</div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </>
  );
};

export default memo(CameraNode);