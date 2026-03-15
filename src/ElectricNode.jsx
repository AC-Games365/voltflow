import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { SYMBOL_MAP } from './symbolMap';

const ElectricNode = ({ data, selected }) => {
  const rotation = data?.rotation || 0;
  const type = data?.type || 'socket'; // Type par défaut
  
  // Récupérer le chemin de l'image SVG
  const iconSrc = SYMBOL_MAP[type];

  return (
    <div style={{ 
      width: '40px', height: '40px', 
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transform: `rotate(${rotation}deg)`, 
      transition: 'transform 0.2s ease',
      outline: selected ? '2px dashed #007bff' : 'none',
      background: 'transparent'
    }}>
      {/* Point d'accroche pour dessiner des câbles */}
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      
      {iconSrc ? <img src={iconSrc} alt={type} style={{ width: '100%', height: '100%' }} draggable="false" /> : <div>?</div>}
      
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
};

export default memo(ElectricNode);