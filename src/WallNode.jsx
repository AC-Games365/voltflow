import { memo } from 'react';

const handleStyle = {
  width: 14,
  height: 14,
  borderRadius: '50%',
  background: '#3182CE',
  border: '2px solid white',
  boxShadow: '0 0 5px rgba(0,0,0,0.2)',
  cursor: 'crosshair',
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 100,
  pointerEvents: 'auto',
};

const WallNode = ({ id, data, selected }) => {
  const isPreview = id === 'wall_preview';
  const rotation = data?.rotation || 0;
  const length = data?.length || 0;
  const thickness = data?.thickness || 15;
  const showDimensions = data?.showWallDimensions !== false; 

  const handleMouseDown = (e, handleType) => {
    e.stopPropagation();
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('startWallResize', { detail: { nodeId: id, handleType } }));
  };

  return (
      <div style={{
        transform: `rotate(${rotation}deg)`,
        // L'origine de la rotation est le centre gauche de l'intersection
        transformOrigin: `${thickness / 2}px 50%`,
        // La div visuelle est allongée pour chevaucher parfaitement les coins à 90°
        width: `${length + thickness}px`,
        height: `${thickness}px`,
        position: 'absolute',
        // Décalé à gauche pour que le "vrai" point de départ soit à x=0
        left: `-${thickness / 2}px`,
        pointerEvents: isPreview ? 'none' : 'auto' 
      }}>
        {/* Hitbox cliquable transparente pour sélectionner le mur */}
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            cursor: 'pointer'
        }}></div>

        {/* Le rendu visuel du mur en SVG avec strokeLinecap="round" pour éviter les piques aux angles */}
        <svg 
            style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                overflow: 'visible',
                pointerEvents: 'none' 
            }} 
            width={length + thickness} 
            height={thickness}
        >
            <line 
                x1={thickness / 2} 
                y1={thickness / 2} 
                x2={length + thickness / 2} 
                y2={thickness / 2} 
                stroke={isPreview ? 'rgba(49, 130, 206, 0.4)' : '#334155'}
                strokeWidth={thickness}
                strokeLinecap="round" // ARRONDI POUR ÉVITER LES PIQUES (Spike fix)
                strokeDasharray={isPreview ? "5,5" : "none"}
            />
        </svg>

        {selected && !isPreview && (
            <>
              <div
                  className="custom-wall-handle nodrag"
                  onMouseDown={(e) => handleMouseDown(e, 'start')}
                  style={{...handleStyle, left: thickness / 2 - 7}} // Positionné exactement sur le nœud A
              />
              <div
                  className="custom-wall-handle nodrag"
                  onMouseDown={(e) => handleMouseDown(e, 'end')}
                  style={{...handleStyle, right: thickness / 2 - 7}} // Positionné exactement sur le nœud B
              />
            </>
        )}

        <div style={{
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          pointerEvents: isPreview ? 'none' : 'auto'
        }}>
          {(showDimensions || isPreview) && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
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
                {Math.round(length)} cm
              </div>
          )}
        </div>
      </div>
  );
};

export default memo(WallNode);