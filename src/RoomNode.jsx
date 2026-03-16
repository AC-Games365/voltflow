import { memo, useMemo } from 'react';
import { NodeResizer } from 'reactflow';

const RoomNode = ({ data, selected, width, height }) => {
  const w = Math.max(Math.round(width || 200), 50);
  const h = Math.max(Math.round(height || 200), 50);

  // Analyse du polygone fourni par le useRoomDetector
  const { pointsString, areaM2, isPolygon } = useMemo(() => {
    const poly = data?.polygon;
    if (!poly || poly.length < 3) return { isPolygon: false };

    // Convertir les coordonnées absolues (du plan) en coordonnées relatives (pour le SVG interne au noeud)
    const minX = Math.min(...poly.map(p => p.x));
    const minY = Math.min(...poly.map(p => p.y));
    const pts = poly.map(p => `${p.x - minX},${p.y - minY}`).join(' ');

    // Formule de l'aire (Shoelace)
    let sum = 0;
    for (let i = 0; i < poly.length; i++) {
      const p1 = poly[i];
      const p2 = poly[(i + 1) % poly.length];
      sum += (p1.x * p2.y) - (p2.x * p1.y);
    }

    const areaCm2 = Math.abs(sum) / 2;
    const aM2 = (areaCm2 / 10000).toFixed(2);

    return { pointsString: pts, areaM2: aM2, isPolygon: true };
  }, [data?.polygon]);

  return (
      <>
        {!isPolygon && (
            <NodeResizer color="#009688" isVisible={selected} minWidth={50} minHeight={50} />
        )}

        <div style={{ width: `${w}px`, height: `${h}px`, position: 'relative', pointerEvents: 'none' }}>

          <svg
              style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}
              width={w}
              height={h}
          >
            {isPolygon ? (
                <polygon
                    points={pointsString}
                    fill={data?.color || '#B3E5FC'} // Bleu très pâle par défaut
                    fillOpacity={selected ? 0.6 : 0.3} // Fond léger
                    stroke={selected ? '#0288D1' : 'transparent'}
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    style={{ pointerEvents: 'all', cursor: 'pointer' }}
                />
            ) : (
                <rect
                    width={w}
                    height={h}
                    fill={data?.color || '#B3E5FC'}
                    fillOpacity={selected ? 0.6 : 0.3}
                    stroke={selected ? '#0288D1' : 'transparent'}
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    rx="4"
                    style={{ pointerEvents: 'all', cursor: 'pointer' }}
                />
            )}
          </svg>

          {/* Affichage Surface et Label */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#01579B',
            pointerEvents: 'none',
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