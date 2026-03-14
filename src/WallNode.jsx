import { memo } from 'react';
import { NodeResizer } from 'reactflow';

const WallNode = ({ id, data, selected, width, height }) => {
  const w = Math.round(width || 15);
  const h = Math.round(height || 15);
  const isHorizontal = w > h;
  const length = isHorizontal ? w : h;
  const isPreview = id === 'wall_preview';

  return (
    <>
      <NodeResizer 
        color="#007bff" 
        isVisible={selected && !isPreview} 
        minWidth={15} 
        minHeight={15} 
      />
      <div style={{ 
        width: '100%', 
        height: '100%', 
        background: isPreview ? 'rgba(0, 123, 255, 0.5)' : (data?.color || '#333'), 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        position: 'relative',
        boxSizing: 'border-box',
        border: isPreview ? '1px dashed #fff' : 'none',
      }}>
        {/* Affichage permanent de la mesure */}
        {length >= 20 && (
          <div style={{
            position: 'absolute',
            background: 'rgba(0, 0, 0, 0.7)',
            color: '#fff',
            padding: '1px 4px',
            borderRadius: '3px',
            fontSize: '10px',
            fontWeight: 'bold',
            pointerEvents: 'none',
            transform: isHorizontal ? 'none' : 'rotate(90deg)',
            whiteSpace: 'nowrap',
            zIndex: 5,
          }}>
            {length} cm
          </div>
        )}
      </div>
    </>
  );
};

export default memo(WallNode);