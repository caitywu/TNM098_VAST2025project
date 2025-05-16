import { max } from 'd3';
import React, { useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

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

      const target = nodeById.get(link.target);
      if (!influenceSources.has(link.target)) return;

      performers.add(link.source);
    });
    return performers;
  }, [links, nodeById, influenceSources]);

  // New: Performers of influenced targets (blue squares)
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
      if (n) nodesSet.set(id, { id, name: n.name || id, group: "oceanusFolkSource" }); // red square
    });

    oceanusFolkPerformers.forEach(id => {
      const n = nodeById.get(id);
      if (n) nodesSet.set(id, { id, name: n.name || id, group: "performer" }); // red circle
    });

    influenceTargets.forEach(id => {
      const n = nodeById.get(id);
      if (n) nodesSet.set(id, { id, name: n.name || id, group: "target" }); // blue circle
    });

    influencedPerformers.forEach(id => {
      const n = nodeById.get(id);
      if (n) nodesSet.set(id, { id, name: n.name || id, group: "influencedPerformer" }); // blue square
    });

    return Array.from(nodesSet.values());
  }, [influenceSources, oceanusFolkPerformers, influenceTargets, influencedPerformers, nodeById]);

  const graphLinks = useMemo(() => {
    // Base links: PerformerOf links for oceanus folk performers and influenced performers, plus influence edges
    return links.filter(link => {
      const edgeType = link.edgeType || link["Edge Type"];

      if (edgeType === "PerformerOf") {
        // PerformerOf for oceanus folk performers (red)
        if (influenceSources.has(link.target) && oceanusFolkPerformers.has(link.source)) return true;
        // PerformerOf for influenced performers (blue)
        if (influenceTargets.has(link.target) && influencedPerformers.has(link.source)) return true;
        return false;
      }

      // Influence edges from oceanus folk sources to targets
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

  // Legend styles
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
              backgroundColor: 'red',
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
              backgroundColor: 'red',
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
              backgroundColor: 'blue',
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
              backgroundColor: 'blue',
              display: 'inline-block',
              clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', // square
            }}
          ></span>
          Performer of Influenced Song/Album 
        </div>
      </div>

        <ForceGraph2D
  graphData={{ nodes: graphNodes, links: graphLinks }}
  nodeLabel={node => `${node.name} (${node.group})`}
  linkLabel={link => `Influence Type: ${link.edgeType || 'Unknown'}`}  
  nodeAutoColorBy="group"
  nodeCanvasObject={(node, ctx, globalScale) => {
    const label = node.name;
    const fontSize = 12 / globalScale;
    ctx.font = `${fontSize}px Sans-Serif`;

    // Determine color
    let color = "blue";
    if (node.group === "performer" || node.group === "oceanusFolkSource") {
      color = "red";
    }

    ctx.fillStyle = color;

    // Draw square for oceanusFolkSource and influencedPerformer, else circle
    if (node.group === "oceanusFolkSource" || node.group === "influencedPerformer") {
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
  linkColor={link => selectedInfluenceTypes.has(link.edgeType) ? 'black' : '#fff'}
/>
    </div>
  );
}

export default NotableArtistNetworkGraph;
