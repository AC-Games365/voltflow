import { useMemo } from 'react';
import { getWallEndpoints } from './useWallDrawer.js';

const roundPoint = (p) => `${Math.round(p.x / 5) * 5},${Math.round(p.y / 5) * 5}`;

export const useAngleNodes = (nodes, showAngles, showAllAngles) => {
    return useMemo(() => {
        if (!showAngles) return [];
        
        const walls = nodes.filter(n => n.type === 'wall' && n.id !== 'wall_preview');
        const points = new Map();
        
        walls.forEach(wall => {
            const [p1, p2] = getWallEndpoints(wall);
            // Angle de p1 vers p2
            const rot = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            
            const k1 = roundPoint(p1);
            if (!points.has(k1)) points.set(k1, { point: p1, angles: [] });
            points.get(k1).angles.push(rot); 
            
            // Angle de p2 vers p1 (exactement l'inverse)
            const rotInv = Math.atan2(p1.y - p2.y, p1.x - p2.x);
            const k2 = roundPoint(p2);
            if (!points.has(k2)) points.set(k2, { point: p2, angles: [] });
            points.get(k2).angles.push(rotInv);
        });
        
        const angleNodes = [];
        
        points.forEach((data, key) => {
            if (data.angles.length === 2) {
                let a1 = data.angles[0];
                let a2 = data.angles[1];

                let diff = a2 - a1;
                while (diff <= -Math.PI) diff += 2 * Math.PI;
                while (diff > Math.PI) diff -= 2 * Math.PI;

                const absDeg = Math.round(Math.abs(diff) * 180 / Math.PI);

                if (absDeg > 0 && absDeg < 180) {
                    if (!showAllAngles && (absDeg === 90 || absDeg === 270)) return;

                    let bisector = a1 + diff / 2;
                    
                    angleNodes.push({
                        id: `angle_${key}`,
                        type: 'angle',
                        position: data.point,
                        data: {
                            a1: a1, 
                            a2: a2, 
                            value: absDeg, 
                            bisector: bisector
                        },
                        selectable: false,
                        draggable: false,
                        zIndex: 20
                    });
                }
            }
        });
        
        return angleNodes;
    }, [nodes, showAngles, showAllAngles]);
};