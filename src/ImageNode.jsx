import { memo } from 'react';
import { NodeResizer } from 'reactflow';

const ImageNode = ({ data, selected }) => {
  return (
    <>
      <NodeResizer color="#007bff" isVisible={selected} minWidth={100} minHeight={100} />
      <div style={{ width: '100%', height: '100%', opacity: data?.opacity ?? 0.5 }}>
        {/* pointerEvents: 'none' empêche le navigateur d'essayer de "glisser" l'image comme un fichier natif */}
        <img src={data?.src} alt="Plan" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', userSelect: 'none' }} />
      </div>
    </>
  );
};

export default memo(ImageNode);