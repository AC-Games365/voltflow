import { memo } from 'react';

const WindowNode = ({ data, selected }) => {
  const rotation = data?.rotation || 0;
  return (
    <div style={{ 
      width: '50px', height: '50px', 
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transform: `rotate(${rotation}deg)`, 
      transition: 'transform 0.2s ease',
      outline: selected ? '2px dashed #007bff' : 'none',
      position: 'relative'
    }}>
      <svg width="50" height="50" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
         {/* Fond pour masquer le mur en dessous */}
         <rect x="-5" y="42" width="110" height="16" fill="#f0f0f0" />
         {/* Cadre de la fenêtre */}
         <rect x="0" y="42" width="100" height="16" fill="none" stroke="#333" strokeWidth="3" />
         {/* Ligne centrale de vitrage */}
         <line x1="0" y1="50" x2="100" y2="50" stroke="#333" strokeWidth="2" />
      </svg>
    </div>
  );
};

export default memo(WindowNode);