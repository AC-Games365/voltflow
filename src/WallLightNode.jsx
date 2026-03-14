import { Handle, Position } from 'reactflow';
import { memo } from 'react';

const WallLightNode = ({ data, selected }) => {
  const rotation = data?.rotation || 0;
  return (
    <>
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      <div style={{ padding: '5px', transform: `rotate(${rotation}deg)`, transition: 'transform 0.2s ease', outline: selected ? '2px dashed #007bff' : 'none' }}>
        <svg width="40" height="40" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
          {/* Ligne représentant le point d'attache sur le mur */}
          <line x1="20" y1="85" x2="80" y2="85" stroke="black" strokeWidth="5" />
          {/* Tige reliant l'ampoule au mur */}
          <line x1="50" y1="85" x2="50" y2="50" stroke="black" strokeWidth="5" />
          {/* Symbole d'ampoule */}
          <circle cx="50" cy="30" r="25" stroke="black" strokeWidth="5" fill="white" />
          <line x1="32" y1="12" x2="68" y2="48" stroke="black" strokeWidth="4" />
          <line x1="68" y1="12" x2="32" y2="48" stroke="black" strokeWidth="4" />
        </svg>
      </div>
      {/* Le label est affiché sous le symbole */}
      <div style={{ fontSize: '12px', textAlign: 'center', padding: '0 5px 5px 5px' }}>{data.label}</div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </>
  );
};

export default memo(WallLightNode);