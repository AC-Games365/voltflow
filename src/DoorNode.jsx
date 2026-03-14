import { memo } from 'react';

const DoorNode = ({ data, selected }) => {
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
         {/* Fond pour masquer le mur en dessous (la même couleur que le canvas) */}
         <rect x="-5" y="42" width="110" height="16" fill="#f0f0f0" />
         {/* Bords du cadre */}
         <rect x="0" y="42" width="5" height="16" fill="#333" />
         <rect x="95" y="42" width="5" height="16" fill="#333" />
         {/* Porte ouverte à 90° */}
         <line x1="2.5" y1="42" x2="2.5" y2="-58" stroke="#333" strokeWidth="5" />
         {/* Arc de cercle d'ouverture */}
         <path d="M 2.5 -58 A 100 100 0 0 1 97.5 42" fill="none" stroke="#333" strokeWidth="2" strokeDasharray="5,5" />
      </svg>
    </div>
  );
};

export default memo(DoorNode);