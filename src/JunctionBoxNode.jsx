import { memo } from 'react';
import { Handle, Position } from 'reactflow';

const JunctionBoxNode = ({ data, selected }) => {
  return (
    <>
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      <div style={{ padding: '5px', outline: selected ? '2px dashed #007bff' : 'none' }}>
        <svg width="40" height="40" viewBox="0 0 100 100">
          {/* Symbole d'une boîte de dérivation (carré simple) */}
          <rect x="20" y="20" width="60" height="60" stroke="black" strokeWidth="5" fill="white" />
          {/* Petite indication de centre ou points de connexion internes */}
          <circle cx="50" cy="50" r="5" fill="black" />
        </svg>
      </div>
      <div style={{ fontSize: '12px', textAlign: 'center', padding: '0 5px 5px 5px' }}>{data.label}</div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </>
  );
};

export default memo(JunctionBoxNode);