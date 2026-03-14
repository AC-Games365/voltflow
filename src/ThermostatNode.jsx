import { Handle, Position } from 'reactflow';
import { memo } from 'react';

const ThermostatNode = ({ data, selected }) => {
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
        <svg width="40" height="40" viewBox="0 0 100 100">
          <rect x="15" y="15" width="70" height="70" rx="10" ry="10" stroke="black" strokeWidth="5" fill="white" />
          <text x="50" y="58" fontFamily="Arial" fontSize="30" fontWeight="bold" textAnchor="middle" fill="black">T°</text>
        </svg>
      </div>
      {/* Le label est affiché sous le symbole */}
      <div style={{ fontSize: '12px', textAlign: 'center', padding: '0 5px 5px 5px' }}>{data.label}</div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </>
  );
};

export default memo(ThermostatNode);