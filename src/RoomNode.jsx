import { memo } from 'react';
import { NodeResizer } from 'reactflow';

const RoomNode = ({ data, selected, width, height }) => {
  const w = Math.round(width || 200);
  const h = Math.round(height || 200);

    const shouldDisplayDimensions = true


  return (
    <>
      <NodeResizer color="#009688" isVisible={selected} minWidth={50} minHeight={50} />
      <div style={{ width: `${w}px`, height: `${h}px`, position: 'relative' }}>
        {/* Arrière-plan semi-transparent de la pièce */}
        <div style={{ 
          position: 'absolute', inset: 0,
          backgroundColor: data?.color || '#009688', 
          opacity: 0.3,
          border: '2px dashed #009688',
          borderRadius: '4px',
        }} />
        
        {/* Texte du nom de la pièce */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#333',
          textAlign: 'center'
        }}>
          {data?.label}
        </div>

        {/* Lignes de cote (Dimensions) */}
        {shouldDisplayDimensions && w > 60 && h > 60 && (
          <svg className="room-dimensions" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <defs>
              <marker id="arrow-dim" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
                <path d="M0,1 L0,7 L8,4 z" fill="#555" />
              </marker>
              <marker id="arrow-dim-rev" markerWidth="8" markerHeight="8" refX="1" refY="4" orient="auto" markerUnits="strokeWidth">
                <path d="M8,1 L8,7 L0,4 z" fill="#555" />
              </marker>
            </defs>
            {/* Horizontal dimension (bottom) */}
            <line x1="8" y1={h - 15} x2={w - 8} y2={h - 15} stroke="#555" strokeWidth="1" markerEnd="url(#arrow-dim)" markerStart="url(#arrow-dim-rev)" />
            <text x={w / 2} y={h - 20} fill="#555" fontSize="10" fontWeight="bold" textAnchor="middle">{w} cm</text>
            
            {/* Vertical dimension (right) */}
            <line x1={w - 15} y1="8" x2={w - 15} y2={h - 8} stroke="#555" strokeWidth="1" markerEnd="url(#arrow-dim)" markerStart="url(#arrow-dim-rev)" />
            <text x={w - 20} y={h / 2} fill="#555" fontSize="10" fontWeight="bold" textAnchor="middle" transform={`rotate(-90 ${w - 20} ${h / 2})`}>{h} cm</text>
          </svg>
        )}
      </div>
    </>
  );
};

export default memo(RoomNode);