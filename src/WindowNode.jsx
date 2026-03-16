import { memo } from 'react';
import { NodeResizer } from 'reactflow';

const WindowNode = ({ data, selected, width, height }) => {
  const w = width || 80;
  const h = height || 15;

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
         handleStyle={{ width: 8, height: 8 }}
      />
      
      {/* Structure de la fenêtre (efface le mur et dessine le vitrage) */}
      <div style={{
          width: '100%',
          height: '100%',
          background: '#ffffff', // Fond blanc pour cacher le mur
          borderTop: '2px solid #334155', // Lignes du mur extérieur
          borderBottom: '2px solid #334155',
          boxSizing: 'border-box',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
      }}>
          {/* Ligne(s) centrale(s) pour représenter le vitrage */}
          <div style={{
              width: '100%',
              height: '3px',
              background: '#3182CE',
              opacity: 0.7
          }} />
          <div style={{
              width: '100%',
              height: '3px',
              background: '#3182CE',
              opacity: 0.7,
              marginTop: '1px'
          }} />
      </div>
    </div>
  );
};

export default memo(WindowNode);