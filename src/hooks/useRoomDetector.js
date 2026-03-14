import { useMemo } from 'react';

const getRoomId = (points) => `room_${points.map(p => `${p.x}-${p.y}`).join('_')}`;

export const useRoomDetector = (wallNodes) => {
  const detectedRooms = useMemo(() => {
    if (wallNodes.length < 3) return [];

    const points = new Map();
    const adj = new Map();

    // 1. Construire le graphe
    wallNodes.forEach(wall => {
      const w = wall.style.width;
      const h = wall.style.height;
      const p1 = { x: wall.position.x, y: wall.position.y };
      const p2 = { x: wall.position.x + w, y: wall.position.y + h };

      const startKey = `${p1.x},${p1.y}`;
      const endKey = `${p2.x},${p2.y}`;

      if (!points.has(startKey)) points.set(startKey, p1);
      if (!points.has(endKey)) points.set(endKey, p2);

      if (!adj.has(startKey)) adj.set(startKey, []);
      if (!adj.has(endKey)) adj.set(endKey, []);
      adj.get(startKey).push(endKey);
      adj.get(endKey).push(startKey);
    });

    const cycles = [];
    const visitedForCycle = new Set();

    // 2. Recherche de cycles (DFS)
    function findNewCycles(path) {
      const startNode = path[0];
      const nextNode = path[path.length - 1];

      const neighbors = adj.get(nextNode) || [];
      for (const neighbor of neighbors) {
        if (path.length > 2 && neighbor === startNode) {
          const cycle = [...path];
          const sortedCycle = cycle.slice().sort();
          const cycleKey = sortedCycle.join('|');
          if (!cycles.some(c => c.key === cycleKey)) {
            cycles.push({ key: cycleKey, path: cycle });
          }
          continue;
        }
        if (!path.includes(neighbor)) {
          findNewCycles([...path, neighbor]);
        }
      }
    }

    for (const startNode of adj.keys()) {
      findNewCycles([startNode]);
    }

    // 3. Convertir les cycles en nœuds 'room'
    const roomNodes = cycles.map(cycle => {
      const cyclePoints = cycle.path.map(key => {
        const [x, y] = key.split(',').map(Number);
        return { x, y };
      });
      
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
        data: { label: 'Pièce', color: '#009688' },
        style: { width, height, zIndex: -1 },
        draggable: false,
        selectable: true,
      };
    }).filter(room => room.style.width > 0 && room.style.height > 0);

    return roomNodes;

  }, [wallNodes]);

  return detectedRooms;
};