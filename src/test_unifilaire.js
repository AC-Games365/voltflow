import { getLayoutedElements } from './layout.js';

const levels = [
  {
    id: 'level_0',
    nodes: [
      { id: '1', type: 'light', data: { circuit: 'A1' } },
      { id: '2', type: 'breaker', data: { circuit: 'A1' } }
    ]
  }
];

const circuits = {};
levels.forEach(level => {
  level.nodes.forEach(n => {
    const circuitName = n.data?.circuit;
    if (circuitName !== null && circuitName !== undefined && String(circuitName).trim() !== '') {
      const c = String(circuitName).trim();
      if (!circuits[c]) circuits[c] = { components: [], breaker: null };
      if (n.type === 'breaker') circuits[c].breaker = n;
      else circuits[c].components.push(n);
    }
  });
});

const initialNodes = [];
const initialEdges = [];
const circuitKeys = Object.keys(circuits).sort();

initialNodes.push({ id: 'uni_main', type: 'default', data: { label: 'Main' } });

circuitKeys.forEach((circuitName) => {
  const circ = circuits[circuitName];
  const brkId = `uni_brk_${circuitName}`;
  initialNodes.push({ id: brkId, type: 'breaker', data: { circuit: circuitName } });
  initialEdges.push({ id: `e_main_${brkId}`, source: 'uni_main', target: brkId });
  let prevId = brkId;
  circ.components.forEach((comp, idx) => {
    const cId = `uni_c_${circuitName}_${idx}`;
    initialNodes.push({ id: cId, type: comp.type, data: { ...comp.data } });
    initialEdges.push({ id: `e_${prevId}_${cId}`, source: prevId, target: cId });
    prevId = cId;
  });
});

try {
  const res = getLayoutedElements(initialNodes, initialEdges);
  console.log(JSON.stringify(res.nodes, null, 2));
} catch (e) {
  console.error("Error:", e);
}
