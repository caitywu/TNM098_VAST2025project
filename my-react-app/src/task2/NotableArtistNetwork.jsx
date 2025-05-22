import React, { useMemo, useState, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { forceCollide } from 'd3-force';
import ForceGraph2D from 'react-force-graph-2d';
import ArtistSelector from '../ArtistSelector';

// Function to get genre colors
function genreColor(genre) {
  if (!genre) return "#999";
  if (genre === "Oceanus Folk") return "red";
  if (genre.toLowerCase().endsWith("rock")) return "#1f77b4";
  if (genre.toLowerCase().endsWith("folk")) return "#2ca02c";
  if (genre.toLowerCase().endsWith("metal")) return "#9467bd";
  if (genre.toLowerCase().endsWith("pop")) return "#ff7f0e";
  return "#000000";
}

// List of all influence types and their colors
const influenceTypeColors = {
  "InStyleOf": "#ff33cc",
  "CoverOf": "#fc8d62",
  "DirectlySamples": "#66c2a5",
  "LyricalReferenceTo": "#984ea3",
  "InterpolatesFrom": "#e78ac3"
};

function NotableArtistNetworkGraph({ nodes, links, yearRange, selectedInfluenceTypes, minNotables }) {
  // States for artist list selection highlight and focus  + time selection 
  const [selectedArtistIds, setSelectedArtistIds] = useState([]);
  const [focusedNodeId, setFocusedNodeId] = useState(null);
  const [minYear, maxYear] = yearRange;
  const [showRedNodes, setShowRedNodes] = useState(true);

  // Get nodes 
  const normalizedNodes = useMemo(() =>
    nodes.map(n => ({
      ...n,
      nodeType: n.nodeType || n["Node Type"] || null,
      release_date: parseInt(n.release_date),
      genre: n.genre || null,
    })), [nodes]);

  const nodeById = useMemo(() => new Map(normalizedNodes.map(n => [n.id, n])), [normalizedNodes]);
  
  // Get oceanus folk source music nodes
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

  // Get the target music nodes from oceanus Folk sources
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

  // Count notable works per performer/group
  const performerNotableCounts = useMemo(() => {
    const counts = new Map();
    links.forEach(link => {
      const edgeType = link.edgeType || link["Edge Type"];
      if (edgeType !== "PerformerOf") return;

      const performer = link.source;
      const work = nodeById.get(link.target);
      if (!work || !work.notable) return;

      counts.set(performer, (counts.get(performer) || 0) + 1);
    });
    return counts;
  }, [links, nodeById]);

  // Oceanus folk performers who performed songs from influenceSources
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

  // Performers influenced by Oceanus folk or related groups, filtered by minNotables for non-"Oceanus Folk"
  const influencedPerformers = useMemo(() => {
    const performers = new Set();
    links.forEach(link => {
      const edgeType = link.edgeType || link["Edge Type"];
      if (edgeType !== "PerformerOf") return;

      const performedNode = nodeById.get(link.target);
      if (!performedNode) return;

      const genre = performedNode.genre;
      const isNotable = performedNode.notable;

      if (!isNotable) return;
      if (!influenceTargets.has(link.target)) return;

      const notableCount = performerNotableCounts.get(link.source) || 0;
      // Only include if Oceanus Folk or has enough notables
      if (genre !== "Oceanus Folk" && notableCount < minNotables) return;

      performers.add(link.source);
    });
    return performers;
  }, [links, influenceTargets, nodeById, performerNotableCounts, minNotables]);

  // Songs performed by Oceanus folk performers
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

  // Songs performed by influenced performers
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

  // Build graph nodes from filtered sets
  const graphNodes = useMemo(() => {
    const nodesSet = new Map();

    // Add oceanus folk sources
    influenceSources.forEach(id => {
      const n = nodeById.get(id);
      if (n) nodesSet.set(id, { id, name: n.name || id, group: "oceanusFolkSource", genre: n.genre });
    });

    // Add oceanus folk performers
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

    // Add influenced performers
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

    // Add songs performed by oceanus folk performers
    performedOceanusSongs.forEach(id => {
      const n = nodeById.get(id);
      if (n) nodesSet.set(id, { id, name: n.name || id, group: "song", genre: n.genre });
    });

    // Add songs performed by influenced performers
    performedInfluencedSongs.forEach(id => {
      const n = nodeById.get(id);
      if (n) nodesSet.set(id, { id, name: n.name || id, group: "song", genre: n.genre });
    });

    return Array.from(nodesSet.values()).filter(node => {
    if (!showRedNodes && node.genre === "Oceanus Folk") {
      return false;
    }
    return true;
  });
}, [nodeById, links, influenceSources, oceanusFolkPerformers, influencedPerformers, performedOceanusSongs, performedInfluencedSongs, influenceTargets, showRedNodes]);

  const validNodeIds = useMemo(() => new Set(graphNodes.map(n => n.id)), [graphNodes]);

  // Filter links based on selected nodes and influence types
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

  const fgRef = useRef();

  useEffect(() => {
    if (!fgRef.current) return;

    fgRef.current.d3Force('charge').strength(-1);
    fgRef.current.d3Force('link').distance(50);
    fgRef.current.d3Force('collision', forceCollide(15));

    if (fgRef.current.d3Force('charge').simulation) {
      fgRef.current.d3Force('charge').simulation.alpha(1).restart();
    } else if (typeof fgRef.current.refresh === 'function') {
      fgRef.current.refresh();
    }
  }, [graphNodes, graphLinks]);

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
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
      <div style={{ maxWidth: 150, maxHeight: 200, overflowY: 'auto' }}>
        <ArtistSelector
          options={graphNodes
            .filter(n => n.group === 'performer' || n.group === 'influencedPerformer')
            .sort((a, b) => a.name.localeCompare(b.name))
          }
          selectedIds={selectedArtistIds}
          onChange={(ids) => {
            setSelectedArtistIds(ids);
            if (ids.length === 1) {
              setFocusedNodeId(ids[0]);
              const node = graphNodes.find(n => n.id === ids[0]);
              if (node && fgRef.current) {
                fgRef.current.centerAt(node.x, node.y, 1000);
                fgRef.current.zoom(4, 1000);
              }
            }
          }}
        />
      </div>

      <div>
        <div style={legendStyle}>
          <div>
            <span style={{ ...shapeStyle, backgroundColor: '#666', clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' }}></span>
            Song/Album
          </div>
          <div>
            <span style={{ ...shapeStyle, backgroundColor: '#666', borderRadius: '50%' }}></span>
            Artist/Music Group
          </div>
        </div>

        <ForceGraph2D
          ref={fgRef}
           graphData={{ nodes: graphNodes, links: graphLinks }}
          nodeLabel={node => `${node.name} (${node.genre || node.group})`}
          linkLabel={link => `Influence Type: ${link.edgeType || 'Unknown'}`}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.name;
            const isFocused = focusedNodeId === node.id;
            const baseFontSize = 10;
            const fontSize = (isFocused ? baseFontSize + 5 : baseFontSize) / globalScale;

            ctx.font = `${isFocused ? "bold " : ""}${fontSize}px Sans-Serif`;

            const color = genreColor(node.genre);
            ctx.fillStyle = color;

            const squareGroups = new Set(["song"]);
            if (squareGroups.has(node.group)) {
              const size = 10;
              ctx.fillRect(node.x - size / 2, node.y - size / 2, size, size);
            } else {
              ctx.beginPath();
              ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI, false);
              ctx.fill();
            }

            ctx.fillStyle = "#4d4d4d";
            ctx.fillText(label, node.x + 6, node.y + 3);
          }}
          linkDirectionalArrowLength={15}
          linkDirectionalArrowRelPos={1}
          width={700}
          height={250}
          linkWidth={link => selectedInfluenceTypes.has(link.edgeType) ? 4 : 2}
          linkColor={link => {
            const baseColor = influenceTypeColors[link.edgeType];
            if (baseColor && selectedInfluenceTypes.has(link.edgeType)) {
              return d3.color(baseColor).copy({ opacity: 0.55 }).formatRgb();
            } else {
              return d3.color('#4d4d4d').copy({ opacity: 0.2 }).formatRgb();
            }
          }}
        />
      </div>
      <div style={{ marginLeft: -150 }}>
  <input
    type="checkbox"
    checked={showRedNodes}
    onChange={() => setShowRedNodes(!showRedNodes)}
  />
  <label style={{ fontSize: 10 }}>Show/Hide Oceanus Folk nodes</label>
</div>
    </div>
  );
}

export default NotableArtistNetworkGraph;
