import { Handle, Position } from 'reactflow';
import { memo } from 'react';
import { getSymbols } from './standards.jsx';

const PanelNode = ({ data, standard = 'be' }) => {
  const symbols = getSymbols(standard);

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      <div style={{ padding: '5px', position: 'relative' }}>
        {data?.circuit && (
          <div style={{ position: 'absolute', top: -8, right: -8, background: '#007bff', color: '#fff', borderRadius: '4px', padding: '2px 4px', fontSize: '10px', fontWeight: 'bold', pointerEvents: 'none', zIndex: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
            {data.circuit}
          </div>
        )}
        
        {symbols.panel(data?.color || 'var(--text-color)')}

      </div>
      <div style={{ fontSize: '10px', textAlign: 'center', marginTop: '2px', color: 'var(--text-color)' }}>{data.label}</div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </>
  );
};

export default memo(PanelNode);
