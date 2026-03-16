import { memo } from 'react';

const AngleNode = ({ data }) => {
  const { a1, a2, value, bisector } = data;
  
  // Rayon de l'arc (plus grand)
  const r = 35;
  
  // Calculer les points de l'arc SVG
  const x1 = r * Math.cos(a1);
  const y1 = r * Math.sin(a1);
  const x2 = r * Math.cos(a2);
  const y2 = r * Math.sin(a2);
  
  // Position du texte sur la bissectrice
  const textDist = r + 15;
  const textX = textDist * Math.cos(bisector);
  const textY = textDist * Math.sin(bisector);

  // svg path setup
  let diff = a2 - a1;
  while (diff <= -Math.PI) diff += 2 * Math.PI;
  while (diff > Math.PI) diff -= 2 * Math.PI;

  // flag pour la direction de dessin de l'arc
  const sweepFlag = diff > 0 ? 1 : 0; 
  const largeArcFlag = 0; // Toujours l'angle intérieur

  return (
    <div style={{ position: 'relative', width: 0, height: 0, overflow: 'visible', pointerEvents: 'none' }}>
      <svg 
         style={{ position: 'absolute', top: -100, left: -100, overflow: 'visible' }} 
         width={200} 
         height={200}
      >
        <path 
           d={`M ${100+x1},${100+y1} A ${r},${r} 0 ${largeArcFlag},${sweepFlag} ${100+x2},${100+y2}`}
           fill="none" 
           stroke="#0288D1" 
           strokeWidth="1.5"
           opacity={0.6}
        />
      </svg>
      
      {/* Etiquette texte */}
      <div style={{
          position: 'absolute',
          left: textX,
          top: textY,
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255, 235, 59, 0.85)',
          color: '#333',
          padding: '2px 5px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 'bold',
          border: '1px solid rgba(200, 180, 0, 0.5)'
      }}>
          {value}°
      </div>
    </div>
  );
};

export default memo(AngleNode);