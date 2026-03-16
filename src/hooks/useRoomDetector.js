import { useMemo } from 'react';

const getRoomId = (points) => `room_${points.map(p => `${Math.round(p.x)}_${Math.round(p.y)}`).join('-')}`;

const getWallEndpoints = (wall) => {
  const w = wall.data?.length || wall.style?.width || 0;
  // On ne prend plus l'épaisseur en compte pour les points logiques, le graphe est une ligne pure
  const rot = (wall.data?.rotation || 0) * Math.PI / 180;

  const x1 = wall.position.x;
  const y1 = wall.position.y;
  const x2 = x1 + w * Math.cos(rot);
  const y2 = y1 + w * Math.sin(rot);

  return [{ x: x1, y: y1 }, { x: x2, y: y2 }];
};

const roundPoint = (p) => `${Math.round(p.x / 5) * 5},${Math.round(p.y / 5) * 5}`;

const getPolygonArea = (polygon) => {
  let sum = 0;
  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % polygon.length];
    sum += (p1.x * p2.y) - (p2.x * p1.y);
  }
  return Math.abs(sum) / 2;
};

const pointInPolygon = (point, vs) => {
    let x = point.x, y = point.y;
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        let xi = vs[i].x, yi = vs[i].y;
        let xj = vs[j].x, yj = vs[j].y;
        let intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

export const useRoomDetector = (wallNodes) => {
  const detectedRooms = useMemo(() => {
    const validWalls = wallNodes.filter(n => n.type === 'wall' && n.id !== 'wall_preview');
    if (validWalls.length < 3) return [];

    const points = new Map();
    const adj = new Map();

    validWalls.forEach(wall => {
      const [p1, p2] = getWallEndpoints(wall);
      const startKey = roundPoint(p1);
      const endKey = roundPoint(p2);

      if (!points.has(startKey)) points.set(startKey, p1);
      if (!points.has(endKey)) points.set(endKey, p2);

      if (!adj.has(startKey)) adj.set(startKey, new Set());
      if (!adj.has(endKey)) adj.set(endKey, new Set());

      if (startKey !== endKey) {
        adj.get(startKey).add(endKey);
        adj.get(endKey).add(startKey);
      }
    });

    const cycles = [];

    function findCycles(path) {
      if (path.length > 20) return;

      const startNode = path[0];
      const nextNode = path[path.length - 1];
      const neighbors = Array.from(adj.get(nextNode) || []);

      for (const neighbor of neighbors) {
        if (path.length > 1 && neighbor === path[path.length - 2]) continue;

        if (path.length > 2 && neighbor === startNode) {
          let minIdx = 0;
          for (let i = 1; i < path.length; i++) {
              if (path[i] < path[minIdx]) minIdx = i;
          }
          const cycle1 = [...path.slice(minIdx), ...path.slice(0, minIdx)];
          
          const revPath = [...path].reverse();
          let minIdxRev = 0;
          for (let i = 1; i < revPath.length; i++) {
              if (revPath[i] < revPath[minIdxRev]) minIdxRev = i;
          }
          const cycle2 = [...revPath.slice(minIdxRev), ...revPath.slice(0, minIdxRev)];
          
          const cycleKey = cycle1.join('|') < cycle2.join('|') ? cycle1.join('|') : cycle2.join('|');
          
          if (!cycles.some(c => c.key === cycleKey)) {
            cycles.push({ key: cycleKey, path: [...path] });
          }
          continue;
        }
        if (!path.includes(neighbor)) {
          findCycles([...path, neighbor]);
        }
      }
    }

    for (const startNode of adj.keys()) {
      findCycles([startNode]);
    }

    const cycleData = cycles.map(cycle => {
        const cyclePoints = cycle.path.map(key => points.get(key));
        const area = getPolygonArea(cyclePoints);
        return { ...cycle, cyclePoints, area };
    });

    const validCycles = [];

    for (const current of cycleData) {
        let hasInternalNode = false;
        const currentPathSet = new Set(current.path);
        
        for (const [nodeKey, nodePoint] of points.entries()) {
            if (!currentPathSet.has(nodeKey)) {
                if (pointInPolygon(nodePoint, current.cyclePoints)) {
                    hasInternalNode = true;
                    break;
                }
            }
        }

        if (!hasInternalNode) {
            validCycles.push(current);
        }
    }

    const roomNodes = validCycles.map(cycle => {
      const cyclePoints = cycle.cyclePoints;
      
      const minX = Math.min(...cyclePoints.map(p => p.x));
      const minY = Math.min(...cyclePoints.map(p => p.y));
      const maxX = Math.max(...cyclePoints.map(p => p.x));
      const maxY = Math.max(...cyclePoints.map(p => p.y));

      const width = maxX - minX;
      const height = maxY - minY;

      return {
        id: getRoomId(cyclePoints),
        type: 'room',
        // La position de la pièce est le minX minY du polygone
        position: { x: minX, y: minY },
        data: { label: 'Pièce', color: '#B3E5FC', polygon: cyclePoints }, 
        style: { width, height, zIndex: -10 }, // zIndex très bas pour être sous les murs
        draggable: false,
        selectable: true,
      };
    }).filter(room => room.style.width > 10 && room.style.height > 10);

    return roomNodes;
  }, [wallNodes]);

  return detectedRooms;
};