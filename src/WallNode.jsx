import { memo } from 'react';
import { NodeResizer } from 'reactflow';

const WallNode = ({ id, data, selected, width, height }) => {
  const w = Math.round(data?.previewWidth || data?.width || width || 15);
  const h = Math.round(data?.previewHeight || data?.height || height || 15);
  const isHorizontal = w > h;
  const length = isHorizontal ? w : h;
  const isPreview = id === 'wall_preview';

  return (
    <>
      {/* Le composant NodeResizer ajoute les poignées pour étirer le mur */}
      <NodeResizer color="#007bff" isVisible={selected && !isPreview} minWidth={10} minHeight={10} />
      <div style={{ 
        width: `${w}px`, height: `${h}px`, 
        background: data?.color || '#333333', 
        borderRadius: '2px', 
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        border: isPreview ? '2px dashed rgba(255, 255, 255, 0.7)' : 'none',
        boxSizing: 'border-box'
      }}>
        {/* Affiche la taille du mur quand il est sélectionné ou en cours de création */}
        {(selected || isPreview) && length >= 30 && (
          <span style={{ 
            color: isPreview ? '#ffffff' : 'rgba(255,255,255,0.8)', 
            fontSize: isPreview ? '14px' : '10px', 
            fontWeight: 'bold', 
            pointerEvents: 'none', 
            transform: isHorizontal ? 'none' : 'rotate(-90deg)', 
            whiteSpace: 'nowrap',
            textShadow: isPreview ? '1px 1px 2px rgba(0,0,0,0.6)' : '1px 1px 2px rgba(0,0,0,0.4)',
            letterSpacing: '1px'
          }}>
            {length} cm
          </span>
        )}
      </div>
    </>
  );
};

export default memo(WallNode);