import { useMemo } from 'react';

const getRoomId = (points) => `room_${points.map(p => `${Math.round(p.x)}_${Math.round(p.y)}`).join('-')}`;

// Fonction utilitaire pour récupérer les vraies coordonnées
const getWallEndpoints = (wall) => {
  const w = wall.style?.width || 0;
  const h = wall.style?.height || 15;
  const rot = (wall.data?.rotation || 0) * Math.PI / 180;

  const x1 = wall.position.x;
  const y1 = wall.position.y + h / 2;
  const x2 = x1 + w * Math.cos(rot);
  const y2 = y1 + w * Math.sin(rot);

  return [{ x: x1, y: y1 }, { x: x2, y: y2 }];
};

// Tolérance de 10px pour que les intersections soient bien fusionnées, même si légèrement décalées
const roundPoint = (p) => `${Math.round(p.x / 10) * 10},${Math.round(p.y / 10) * 10}`;

// Formule de l'aire pour trier les cycles
const getPolygonArea = (polygon) => {
  let sum = 0;
  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % polygon.length];
    sum += (p1.x * p2.y) - (p2.x * p1.y);
  }
  return Math.abs(sum) / 2;
};

// Algorithme du point dans un polygone (Ray-casting)
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

    // 1. Construire le graphe de connexion
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

    // 2. Recherche de cycles (DFS)
    function findCycles(path) {
      if (path.length > 20) return; // Sécurité

      const startNode = path[0];
      const nextNode = path[path.length - 1];
      const neighbors = Array.from(adj.get(nextNode) || []);

      for (const neighbor of neighbors) {
        // Ne pas revenir sur ses pas immédiatement
        if (path.length > 1 && neighbor === path[path.length - 2]) continue;

        if (path.length > 2 && neighbor === startNode) {
          // On a bouclé ! On normalise le cycle pour éviter de l'ajouter 50 fois
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

    // 3. Filtrer les cycles pour ne garder que les "faces" intérieures
    const cycleData = cycles.map(cycle => {
        const cyclePoints = cycle.path.map(key => points.get(key));
        const area = getPolygonArea(cyclePoints);
        return { ...cycle, cyclePoints, area };
    });

    const validCycles = [];

    for (const current of cycleData) {
        let hasInternalNode = false;
        const currentPathSet = new Set(current.path);
        
        // Si un noeud du graphe est strictement à l'intérieur de ce cycle, 
        // alors ce cycle englobe d'autres pièces (c'est le périmètre de la maison), on l'ignore.
        for (const [nodeKey, nodePoint] of points.entries()) {
            if (!currentPathSet.has(nodeKey)) {
                if (pointInPolygon(nodePoint, current.cyclePoints)) {
                    hasInternalNode = true;
                    break;
                }
            }
        }

        // Il faut aussi filtrer les cycles qui partagent des cordes (des murs qui traversent la pièce)
        // Mais l'heuristique des noeuds internes suffit dans 95% des cas de dessin de murs.
        if (!hasInternalNode) {
            validCycles.push(current);
        }
    }

    // 4. Convertir en noeuds de pièces (RoomNodes)
    const roomNodes = validCycles.map(cycle => {
      const cyclePoints = cycle.cyclePoints;

      // Plus besoin de trier (sortPoints), le DFS nous a donné l'ordre naturel du tracé !
      
      const minX = Math.min(...cyclePoints.map(p => p.x));
      const minY = Math.min(...cyclePoints.map(p => p.y));
      const maxX = Math.max(...cyclePoints.map(p => p.x));
      const maxY = Math.max(...cyclePoints.map(p => p.y));

      const width = maxX - minX;
      const height = maxY - minY;

      return {
        id: getRoomId(cyclePoints),
        type: 'room',
        position: { x: minX, y: minY },
        data: { label: 'Pièce', color: '#009688', polygon: cyclePoints }, 
        style: { width, height, zIndex: -1 },
        draggable: false,
        selectable: true,
      };
    }).filter(room => room.style.width > 10 && room.style.height > 10);

    return roomNodes;
  }, [wallNodes]);

  return detectedRooms;
};