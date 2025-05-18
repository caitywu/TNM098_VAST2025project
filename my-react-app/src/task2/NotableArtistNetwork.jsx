import { max } from 'd3';
import React, { useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

function genreColor(genre) {
  if (!genre) return "#999";
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

      const performedNode = nodeById.get(link.target);
      if (!performedNode) return;

      const genre = performedNode.genre;
      const isNotable = performedNode.notable;
      if (genre !== "Oceanus Folk" && !isNotable) return;

      if (!influenceTargets.has(link.target)) return;

      performers.add(link.source);
    });
    return performers;
  }, [links, influenceTargets, nodeById]);

  const performedOceanusSongs = useMemo(() => {
    const songIds = new Set();
    links.forEach(link => {
      const edgeType = link.edgeType || link["Edge Type"];
      if (edgeType !== "PerformerOf") return;

      if (oceanusFolkPerformers.has(link.source) && influenceSources.has(link.target)) {
        songIds.add(link.target);
      }
    });
    return songIds;
  }, [links, oceanusFolkPerformers, influenceSources]);

  const performedInfluencedSongs = useMemo(() => {
    const songIds = new Set();
    links.forEach(link => {
      const edgeType = link.edgeType || link["Edge Type"];
      if (edgeType !== "PerformerOf") return;

      if (influencedPerformers.has(link.source) && influenceTargets.has(link.target)) {
        songIds.add(link.target);
      }
    });
    return songIds;
  }, [links, influencedPerformers, influenceTargets]);

  const graphNodes = useMemo(() => {
    const nodesSet = new Map();

    influenceSources.forEach(id => {
      const n = nodeById.get(id);
      if (n) nodesSet.set(id, { id, name: n.name || id, group: "oceanusFolkSource", genre: n.genre });
    });

    oceanusFolkPerformers.forEach(id => {
      const n = nodeById.get(id);
      if (!n) return;

      const songLink = links.find(link =>
        (link.edgeType || link["Edge Type"]) === "PerformerOf" &&
        link.source === id &&
        influenceSources.has(link.target)
      );

      const songNode = songLink ? nodeById.get(songLink.target) : null;
      const genre = songNode?.genre || n.genre;

      nodesSet.set(id, { id, name: n.name || id, group: "performer", genre });
    });

    influencedPerformers.forEach(id => {
      const n = nodeById.get(id);
      if (!n) return;

      const songLink = links.find(link =>
        (link.edgeType || link["Edge Type"]) === "PerformerOf" &&
        link.source === id &&
        influenceTargets.has(link.target)
      );

      const songNode = songLink ? nodeById.get(songLink.target) : null;
      const genre = songNode?.genre || n.genre;

      nodesSet.set(id, { id, name: n.name || id, group: "influencedPerformer", genre });
    });

    performedOceanusSongs.forEach(id => {
      const n = nodeById.get(id);
      if (n) nodesSet.set(id, { id, name: n.name || id, group: "song", genre: n.genre });
    });

    performedInfluencedSongs.forEach(id => {
      const n = nodeById.get(id);
      if (n) nodesSet.set(id, { id, name: n.name || id, group: "song", genre: n.genre });
    });

    return Array.from(nodesSet.values());
  }, [nodeById, links, influenceSources, oceanusFolkPerformers, influencedPerformers, performedOceanusSongs, performedInfluencedSongs, influenceTargets]);

  const validNodeIds = useMemo(() => new Set(graphNodes.map(n => n.id)), [graphNodes]);

  const graphLinks = useMemo(() => {
    return links.filter(link => {
      const edgeType = link.edgeType || link["Edge Type"];
      const sourceInSet = validNodeIds.has(link.source);
      const targetInSet = validNodeIds.has(link.target);

      if (!sourceInSet || !targetInSet) return false;

      if (edgeType === "PerformerOf") {
        return (
          (influenceSources.has(link.target) && oceanusFolkPerformers.has(link.source)) ||
          (influenceTargets.has(link.target) && influencedPerformers.has(link.source))
        );
      }

      return selectedInfluenceTypes.has(edgeType);
    }).map(link => ({
      source: link.source,
      target: link.target,
      edgeType: link.edgeType || link["Edge Type"]
    }));
  }, [links, validNodeIds, influenceSources, oceanusFolkPerformers, influenceTargets, influencedPerformers, selectedInfluenceTypes]);

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
            backgroundColor: '#666', 
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
          }}></span> Song/Album </div>
    <div>
    <span
      style={{
        ...shapeStyle,
        backgroundColor: '#666',
        borderRadius: '50%', 
      }}></span> Artist/Music Group </div>
    </div>

      <ForceGraph2D
        graphData={{ nodes: graphNodes, links: graphLinks }}
        nodeLabel={node => `${node.name} (${node.genre || node.group})`}
        linkLabel={link => `Influence Type: ${link.edgeType || 'Unknown'}`}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.name;
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;

          const color = genreColor(node.genre);
          ctx.fillStyle = color;

          const squareGroups = new Set(["song"]);
          if (squareGroups.has(node.group)) {
            const size = 10;
            ctx.fillRect(node.x - size / 2, node.y - size / 2, size, size);
          } else {
            ctx.beginPath();
            ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);
            ctx.fill();
          }

          ctx.fillStyle = "#4d4d4d";
          ctx.fillText(label, node.x + 6, node.y + 3);
        }}
        linkDirectionalArrowLength={15}
        linkDirectionalArrowRelPos={1}
        width={700}
        height={250}
        linkWidth={link => selectedInfluenceTypes.has(link.edgeType) ? 3 : 1.5}
        linkColor={link => selectedInfluenceTypes.has(link.edgeType) ? 'white' : '#4d4d4d'}
      />
    </div>
  );
}

export default NotableArtistNetworkGraph;
