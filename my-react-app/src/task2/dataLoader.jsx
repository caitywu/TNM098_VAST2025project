export async function loadGraphData(url) {
  const raw = await fetch(url).then(r => r.json());

  // Filter out non-notable nodes
  const nodes = raw.nodes.filter(n => {
    return (n.nodeType === 'Song' || n.nodeType === 'Album') ? n.notable : true;
  }).map(n => ({ ...n, id: String(n.id) }));

  const links = raw.links.map(l => ({
    ...l,
    source: String(l.source),
    target: String(l.target),
  }));

  return { nodes, links };
}
