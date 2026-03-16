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
        left: 0,
        borderRadius: '8px', // Adoucit les coins aux intersections
      }}>
        <NodeResizer
            color="#3182CE"
            isVisible={selected && !isPreview}
            minWidth={15}
            minHeight={15}
        />

        <div style={{
          width: '100%',
          height: '100%',
          // Pas de bordure sur les vrais murs pour qu'ils "fusionnent" visuellement
          background: isPreview ? 'rgba(49, 130, 206, 0.4)' : '#334155',
          border: isPreview ? '2px dashed #3182CE' : 'none',
          borderRadius: '8px',
          position: 'relative',
          boxSizing: 'border-box',
        }}>

          {/* Badge de mesure centré avec effet "flottant" */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            // translate(-50%, -50%) centre l'élément, rotate(-rotation) annule la rotation du mur
            transform: `translate(-50%, -50%) rotate(${-rotation}deg)`,
            background: '#ffffff',
            color: '#1A202C',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 'bold',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}>
            {length} cm
          </div>
        </div>
      </div>
  );
};

export default memo(WallNode);