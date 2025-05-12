// dataLoader.js
export async function loadGraphData(url) {
  const raw = await fetch(url).then(r => r.json());

  const nodes = raw.nodes.map(n => ({ ...n, id: String(n.id) }));
  const links = raw.links.map(l => ({
    ...l,
    source: String(l.source),
    target: String(l.target),
  }));

  return { nodes, links };
}
