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

// Arrondi pour "fusionner" les points qui sont presque au même endroit (tolérance de 5px)
const roundPoint = (p) => `${Math.round(p.x / 5) * 5},${Math.round(p.y / 5) * 5}`;

export const useRoomDetector = (wallNodes) => {
  const detectedRooms = useMemo(() => {
    // On ne garde que les vrais murs terminés
    const validWalls = wallNodes.filter(n => n.type === 'wall' && n.id !== 'wall_preview');
    if (validWalls.length < 3) return [];

    const points = new Map();
    const adj = new Map();

    // 1. Construire le graphe de connexion avec les VRAIES coordonnées
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

    // 2. Recherche de cycles optimisée (DFS limité)
    function findCycles(path) {
      // Limite de sécurité pour éviter de figer le navigateur
      if (path.length > 15) return;

      const startNode = path[0];
      const nextNode = path[path.length - 1];
      const neighbors = Array.from(adj.get(nextNode) || []);

      for (const neighbor of neighbors) {
        if (path.length > 2 && neighbor === startNode) {
          const sortedCycle = [...path].sort();
          const cycleKey = sortedCycle.join('|');
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

    // 3. Convertir en pièces
    const roomNodes = cycles.map(cycle => {
      const cyclePoints = cycle.path.map(key => points.get(key));

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
        data: { label: 'Pièce', color: '#009688', polygon: cyclePoints }, // On sauvegarde le polygone pour le futur !
        style: { width, height, zIndex: -1 },
        draggable: false, // On ne déplace pas une pièce directement comme ça
        selectable: true,
      };
    }).filter(room => room.style.width > 10 && room.style.height > 10);

    return roomNodes;
  }, [wallNodes]);

  return detectedRooms;
};