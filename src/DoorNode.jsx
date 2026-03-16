import { memo } from 'react';
import { NodeResizer } from 'reactflow';

const DoorNode = ({ data, selected, width, height }) => {
  const w = width || 80; // Largeur par défaut 80cm
  const h = height || 15; // Épaisseur par défaut 15cm
  const flip = data?.flip || false;
  
  // La porte est dessinée comme un arc de cercle
  // On utilise la largeur pour le rayon de l'arc
  return (
    <div style={{
      width: `${w}px`,
      height: `${h}px`,
      position: 'relative',
      boxSizing: 'border-box',
    }}>
      <NodeResizer 
         color="#3182CE" 
         isVisible={selected} 
         minWidth={40} 
         minHeight={5}
         // On ne permet de redimensionner que la largeur et la hauteur
         handleStyle={{ width: 8, height: 8 }}
      />
      
      {/* Structure de base de la porte (l'encadrement dans le mur) */}
      <div style={{
          width: '100%',
          height: '100%',
          background: '#ffffff', // Pour masquer le mur en dessous
          borderTop: '2px solid #334155',
          borderBottom: '2px solid #334155',
          boxSizing: 'border-box',
          position: 'relative'
      }}>
         {/* Le battant de la porte */}
         <div style={{
             position: 'absolute',
             top: flip ? '100%' : '0',
             left: '0',
             width: `${w}px`,
             height: '4px',
             background: '#334155',
             transformOrigin: 'left center',
             transform: `rotate(${flip ? 45 : -45}deg)`,
             zIndex: 5
         }} />
         
         {/* L'arc de cercle d'ouverture (SVG) */}
         <svg 
            style={{ 
                position: 'absolute', 
                top: flip ? '0' : `-${w - h}px`, 
                left: '0',
                pointerEvents: 'none'
            }} 
            width={w} 
            height={w}
         >
             <path 
                d={`M 0,${flip ? 0 : w} A ${w},${w} 0 0,${flip ? 0 : 1} ${w},${flip ? w : 0}`}
                fill="none"
                stroke="#3182CE"
                strokeWidth="1"
                strokeDasharray="4 4"
             />
         </svg>
      </div>
    </div>
  );
};

export default memo(DoorNode);