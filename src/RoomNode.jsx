import { memo, useMemo } from 'react';
import { NodeResizer } from 'reactflow';

const RoomNode = ({ data, selected, width, height }) => {
  const w = Math.max(Math.round(width || 200), 50);
  const h = Math.max(Math.round(height || 200), 50);

  // Analyse du polygone fourni par le useRoomDetector
  const { pointsString, areaM2, isPolygon } = useMemo(() => {
    const poly = data?.polygon;
    if (!poly || poly.length < 3) return { isPolygon: false };

    // 1. Convertir les coordonnées absolues (du plan) en coordonnées relatives (pour le SVG)
    const minX = Math.min(...poly.map(p => p.x));
    const minY = Math.min(...poly.map(p => p.y));
    const pts = poly.map(p => `${p.x - minX},${p.y - minY}`).join(' ');

    // 2. Calculer l'aire exacte du polygone avec la formule de Gauss (Shoelace formula)
    let sum = 0;
    for (let i = 0; i < poly.length; i++) {
      const p1 = poly[i];
      const p2 = poly[(i + 1) % poly.length];
      sum += (p1.x * p2.y) - (p2.x * p1.y);
    }

    // Nos dimensions sont en cm, donc l'aire est en cm². On divise par 10000 pour les m².
    const areaCm2 = Math.abs(sum) / 2;
    const aM2 = (areaCm2 / 10000).toFixed(2);

    return { pointsString: pts, areaM2: aM2, isPolygon: true };
  }, [data?.polygon]);

  return (
      <>
        {/* On ne garde le Resizer que si ce n'est pas un polygone généré automatiquement */}
        {!isPolygon && (
            <NodeResizer color="#009688" isVisible={selected} minWidth={50} minHeight={50} />
        )}

        <div style={{ width: `${w}px`, height: `${h}px`, position: 'relative' }}>

          {/* Le fond de la pièce : Un SVG qui épouse la forme parfaite ! */}
          <svg
              style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
              width={w}
              height={h}
          >
            {isPolygon ? (
                <polygon
                    points={pointsString}
                    fill={data?.color || '#009688'}
                    fillOpacity={0.2}
                    stroke={selected ? '#009688' : 'transparent'}
                    strokeWidth="2"
                    strokeDasharray="4 4"
                />
            ) : (
                /* Fallback au cas où ce serait une pièce dessinée manuellement (rectangle classique) */
                <rect
                    width={w}
                    height={h}
                    fill={data?.color || '#009688'}
                    fillOpacity={0.2}
                    stroke={selected ? '#009688' : 'transparent'}
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    rx="4"
                />
            )}
          </svg>

          {/* Informations de la pièce (Nom + Surface en m²) centrées */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2D3748',
            pointerEvents: 'none', // Pour ne pas gêner les clics sur les murs en dessous
          }}>
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
            {data?.label || 'Pièce'}
          </span>
            {isPolygon && (
                <span style={{ fontSize: '14px', marginTop: '4px', backgroundColor: 'rgba(255,255,255,0.7)', padding: '2px 6px', borderRadius: '4px' }}>
              {areaM2} m²
            </span>
            )}
          </div>
        </div>
      </>
  );
};

export default memo(RoomNode);