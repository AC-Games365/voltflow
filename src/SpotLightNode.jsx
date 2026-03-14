import { Handle, Position } from 'reactflow';
import { memo } from 'react';

const SpotLightNode = ({ data, selected }) => {
  const rotation = data?.rotation || 0;
  return (
    <>
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      <div style={{ padding: '5px', transform: `rotate(${rotation}deg)`, transition: 'transform 0.2s ease', outline: selected ? '2px dashed #007bff' : 'none' }}>
        <svg width="40" height="40" viewBox="0 0 100 100">
          {/* Cercle extérieur */}
          <circle cx="50" cy="50" r="40" stroke="black" strokeWidth="5" fill="white" />
          {/* Point/Cercle intérieur pour désigner l'encastrement */}
          <circle cx="50" cy="50" r="15" fill="black" />
        </svg>
      </div>
      {/* Le label est affiché sous le symbole */}
      <div style={{ fontSize: '12px', textAlign: 'center', padding: '0 5px 5px 5px' }}>{data.label}</div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </>
  );
};

export default memo(SpotLightNode);