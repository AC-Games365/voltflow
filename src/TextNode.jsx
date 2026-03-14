import { memo } from 'react';

const TextNode = ({ data, selected }) => {
  return (
    <div style={{ 
      padding: '5px',
      fontSize: data?.fontSize ? `${data.fontSize}px` : '20px',
      color: data?.color || '#333',
      fontWeight: 'bold',
      outline: selected ? '2px dashed #007bff' : 'none',
      cursor: 'grab',
      whiteSpace: 'nowrap'
    }}>
      {data?.label || 'Texte'}
    </div>
  );
};

export default memo(TextNode);