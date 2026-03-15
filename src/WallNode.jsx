import { memo } from 'react';
import { NodeResizer } from 'reactflow';

const WallNode = ({ id, data, selected, width, height }) => {
  const isPreview = id === 'wall_preview';
  
  const rotation = data?.rotation || 0;
  const length = data?.length || Math.max(width || 15, height || 15);

  return (
    <div style={{
        transform: `rotate(${rotation}deg)`,
        transformOrigin: '0% 50%',
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0
    }}>
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
        {/* Affichage permanent de la mesure sur tous les murs */}
        <div style={{
          position: 'absolute',
          background: 'rgba(0, 0, 0, 0.7)',
          color: '#fff',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold',
          pointerEvents: 'none',
          // On garde le texte droit même si le mur tourne
          transform: `rotate(${-rotation}deg)`,
          whiteSpace: 'nowrap',
          zIndex: 5,
        }}>
          {length} cm
        </div>
      </div>
    </div>
  );
};

export default memo(WallNode);