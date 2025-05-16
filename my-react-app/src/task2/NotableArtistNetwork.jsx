import { max } from 'd3';
import React, { useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

// Use your genreColor function here
function genreColor(genre) {
  if (!genre) return "#999"; // fallback color
  if (genre === "Oceanus Folk") return "red";
  if (genre.toLowerCase().endsWith("rock")) return "#1f77b4";
  if (genre.toLowerCase().endsWith("folk")) return "#2ca02c";
  if (genre.toLowerCase().endsWith("metal")) return "#9467bd";
  if (genre.toLowerCase().endsWith("pop")) return "#ff7f0e";
  return "#000000";
}

function NotableArtistNetworkGraph({ nodes, links, yearRange, selectedInfluenceTypes }) {
  const [minYear, maxYear] = yearRange;

  const normalizedNodes = useMemo(() =>
    nodes.map(n => ({
      ...n,
      nodeType: n.nodeType || n["Node Type"] || null,
      release_date: parseInt(n.release_date),
      genre: n.genre || null,
    })), [nodes]);

  const nodeById = useMemo(() => new Map(normalizedNodes.map(n => [n.id, n])), [normalizedNodes]);

  const influenceSources = useMemo(() => {
    const sources = new Set();
    links.forEach(link => {
      const edgeType = link.edgeType || link["Edge Type"];
      if (!selectedInfluenceTypes.has(edgeType)) return;

      const source = nodeById.get(link.source);
      if (!source || source.genre !== "Oceanus Folk") return;
      if (isNaN(source.release_date) || source.release_date < minYear || source.release_date > maxYear) return;

      sources.add(link.source);
    });
    return sources;
  }, [links, selectedInfluenceTypes, nodeById, minYear, maxYear]);

  const influenceTargets = useMemo(() => {
    const targets = new Set();
    links.forEach(link => {
      const edgeType = link.edgeType || link["Edge Type"];
      if (!selectedInfluenceTypes.has(edgeType)) return;
      if (!influenceSources.has(link.source)) return;

      targets.add(link.target);
    });
    return targets;
  }, [links, selectedInfluenceTypes, influenceSources]);

  const oceanusFolkPerformers = useMemo(() => {
    const performers = new Set();
    links.forEach(link => {
      const edgeType = link.edgeType || link["Edge Type"];
      if (edgeType !== "PerformerOf") return;

      if (!influenceSources.has(link.target)) return;

      performers.add(link.source);
    });
    return performers;
  }, [links, influenceSources]);

  const influencedPerformers = useMemo(() => {
    const performers = new Set();
    links.forEach(link => {
      const edgeType = link.edgeType || link["Edge Type"];
      if (edgeType !== "PerformerOf") return;
      if (!influenceTargets.has(link.target)) return;

      performers.add(link.source);
    });
    return performers;
  }, [links, influenceTargets]);

  const graphNodes = useMemo(() => {
    const nodesSet = new Map();

    influenceSources.forEach(id => {
      const n = nodeById.get(id);
      if (n) nodesSet.set(id, { id, name: n.name || id, group: "oceanusFolkSource", genre: n.genre });
    });

      oceanusFolkPerformers.forEach(id => {
  const n = nodeById.get(id);
  if (!n) return;

  // Find one song they performed
  const performedLink = links.find(
    l => (l.edgeType || l["Edge Type"]) === "PerformerOf" &&
         l.source === id &&
         influenceSources.has(l.target)
  );
  const songNode = performedLink ? nodeById.get(performedLink.target) : null;
  const genre = songNode?.genre || null;

  nodesSet.set(id, { id, name: n.name || id, group: "performer", genre });
});

    influenceTargets.forEach(id => {
      const n = nodeById.get(id);
      if (n) nodesSet.set(id, { id, name: n.name || id, group: "target", genre: n.genre });
    });

      influencedPerformers.forEach(id => {
  const n = nodeById.get(id);
  if (!n) return;

  const performedLink = links.find(
    l => (l.edgeType || l["Edge Type"]) === "PerformerOf" &&
         l.source === id &&
         influenceTargets.has(l.target)
  );
  const songNode = performedLink ? nodeById.get(performedLink.target) : null;
  const genre = songNode?.genre || null;

  nodesSet.set(id, { id, name: n.name || id, group: "influencedPerformer", genre });
});

    return Array.from(nodesSet.values());
  }, [influenceSources, oceanusFolkPerformers, influenceTargets, influencedPerformers, nodeById]);

  const graphLinks = useMemo(() => {
    return links.filter(link => {
      const edgeType = link.edgeType || link["Edge Type"];

      if (edgeType === "PerformerOf") {
        if (influenceSources.has(link.target) && oceanusFolkPerformers.has(link.source)) return true;
        if (influenceTargets.has(link.target) && influencedPerformers.has(link.source)) return true;
        return false;
      }

      if (selectedInfluenceTypes.has(edgeType)) {
        return influenceSources.has(link.source) && influenceTargets.has(link.target);
      }

      return false;
    }).map(link => ({
      source: link.source,
      target: link.target,
      edgeType: link.edgeType || link["Edge Type"]
    }));
  }, [links, influenceSources, oceanusFolkPerformers, influenceTargets, influencedPerformers, selectedInfluenceTypes]);

  const legendStyle = {
    display: 'flex',
    gap: '20px',
    padding: '5px',
    fontSize: '8px',
    alignItems: 'center',
    userSelect: 'none',
    backgroundColor: '#fff',
    maxWidth: '550px',
  };

  const shapeStyle = {
    display: 'inline-block',
    width: '8px',
    height: '8px',
    marginRight: '6px',
    verticalAlign: 'middle',
  };

  return (
    <div>
      <div style={legendStyle}>
        <div>
          <span
            style={{
              ...shapeStyle,
              backgroundColor: genreColor("Oceanus Folk"),
              borderRadius: '50%',
              display: 'inline-block',
            }}
          ></span>
          Oceanus Folk Performer
        </div>

        <div>
          <span
            style={{
              ...shapeStyle,
              backgroundColor: genreColor("Oceanus Folk"),
              display: 'inline-block',
              clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', // square
            }}
          ></span>
          Oceanus Folk Song/Album
        </div>

        <div>
          <span
            style={{
              ...shapeStyle,
              backgroundColor: genreColor("Rock"), // example: adjust as needed for influenced target genre
              borderRadius: '50%',
              display: 'inline-block',
            }}
          ></span>
          Influenced Song/Album
        </div>

        <div>
          <span
            style={{
              ...shapeStyle,
              backgroundColor: genreColor("Rock"), // example for influenced performer genre
              display: 'inline-block',
              clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', // square
            }}
          ></span>
          Performer of Influenced Song/Album 
        </div>
      </div>

      <ForceGraph2D
        graphData={{ nodes: graphNodes, links: graphLinks }}
        nodeLabel={node => `${node.name} (${node.genre || node.group})`}
        linkLabel={link => `Influence Type: ${link.edgeType || 'Unknown'}`}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.name;
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;

          // Use genre color for nodes
          const color = genreColor(node.genre);

          ctx.fillStyle = color;

          // Draw square for song/album nodes, circle for artists/groups (adjust as needed)
          // Here I assume nodeType or group could determine shape; modify logic if needed.
          // Let's say: squares for songs/albums, circles for artists/groups

          const squareGroups = new Set(["oceanusFolkSource", "influencedPerformer"]);
          if (squareGroups.has(node.group)) {
            const size = 6;
            ctx.fillRect(node.x - size / 2, node.y - size / 2, size, size);
          } else {
            ctx.beginPath();
            ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);
            ctx.fill();
          }

          // Draw label
          ctx.fillStyle = "black";
          ctx.fillText(label, node.x + 6, node.y + 3);
        }}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        width={700}
        height={250}
        linkWidth={link => selectedInfluenceTypes.has(link.edgeType) ? 3 : 1.5}
        linkColor={link => selectedInfluenceTypes.has(link.edgeType) ? 'black' : '#ddd'}
      />
    </div>
  );
}

export default NotableArtistNetworkGraph;
