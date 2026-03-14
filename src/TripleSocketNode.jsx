import { Handle, Position } from 'reactflow';
import { memo } from 'react';

const TripleSocketNode = ({ data, selected }) => {
  const rotation = data?.rotation || 0;
  return (
    <>
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      <div style={{ padding: '5px', transform: `rotate(${rotation}deg)`, transition: 'transform 0.2s ease', outline: selected ? '2px dashed #007bff' : 'none', position: 'relative' }}>
        {data?.circuit && (
          <div style={{ position: 'absolute', top: -8, right: -8, background: '#dc3545', color: '#fff', borderRadius: '4px', padding: '2px 4px', fontSize: '10px', fontWeight: 'bold', transform: `rotate(${-rotation}deg)`, pointerEvents: 'none', zIndex: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
            {data.circuit}
          </div>
        )}
        {data?.annotation && (
          <div style={{ position: 'absolute', bottom: -12, right: -12, background: 'rgba(255, 255, 255, 0.9)', color: '#333', border: '1px solid #aaa', borderRadius: '3px', padding: '1px 4px', fontSize: '9px', fontWeight: 'bold', transform: `rotate(${-rotation}deg)`, pointerEvents: 'none', zIndex: 10, whiteSpace: 'nowrap', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
            {data.annotation}
          </div>
        )}
        <svg width="120" height="40" viewBox="0 0 300 100">
            {/* 1ère Prise */}
            <circle cx="50" cy="50" r="45" stroke="black" strokeWidth="5" fill="white" />
            <path d="M 50 20 A 30 30 0 0 1 50 80" stroke="black" strokeWidth="5" fill="none" />
            <line x1="50" y1="20" x2="50" y2="80" stroke="black" strokeWidth="5" />
            {/* 2ème Prise */}
            <circle cx="150" cy="50" r="45" stroke="black" strokeWidth="5" fill="white" />
            <path d="M 150 20 A 30 30 0 0 1 150 80" stroke="black" strokeWidth="5" fill="none" />
            <line x1="150" y1="20" x2="150" y2="80" stroke="black" strokeWidth="5" />
            {/* 3ème Prise */}
            <circle cx="250" cy="50" r="45" stroke="black" strokeWidth="5" fill="white" />
            <path d="M 250 20 A 30 30 0 0 1 250 80" stroke="black" strokeWidth="5" fill="none" />
            <line x1="250" y1="20" x2="250" y2="80" stroke="black" strokeWidth="5" />
        </svg>
      </div>
      <div style={{ fontSize: '12px', textAlign: 'center', padding: '0 5px 5px 5px' }}>{data.label}</div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </>
  );
};

export default memo(TripleSocketNode);