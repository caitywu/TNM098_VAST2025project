import React, { useMemo, useState, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { forceCollide } from 'd3-force';
import ForceGraph2D from 'react-force-graph-2d';
import ArtistSelector from '../SimpleArtistSelector';

// Function to color encode based on genre
function genreColor(genre) {
  if (!genre) return "#999";
  const g = genre.toLowerCase();
  if (genre === "Oceanus Folk") return "red";
  if (g.includes("rock")) return "#1f77b4";
  if (g.includes("folk")) return "#2ca02c";
  if (g.includes("metal")) return "#9467bd";
  if (g.includes("pop")) return "#ff7f0e";
  return "#000";
}

// Influence type colors
const influenceTypeColors = {
  InStyleOf: "#ff33cc",
  CoverOf: "#fc8d62",
  DirectlySamples: "#66c2a5",
  LyricalReferenceTo: "#984ea3",
  InterpolatesFrom: "#e78ac3"
};

const CONTRIBUTOR_EDGE_TYPES = new Set([
  "PerformerOf",
  "ComposerOf",
  "ProducerOf",
  "LyricistOf"
]);

const getEdgeType = (link) => link.edgeType || link["Edge Type"];
const getNodeType = (node) => node.nodeType || node["Node Type"];

export default function NotableArtistNetworkGraph({
  nodes, links, yearRange, selectedInfluenceTypes, minNotables = 0
}) {
  const [focusedNodeId, setFocusedNodeId] = useState(null);
  const [selectedArtistIds, setSelectedArtistIds] = useState([]);
  const [showOceanusFolk, setOceanusFolkNodes] = useState(true);
  const fgRef = useRef();
  const [minYear, maxYear] = yearRange;

  const nodeById = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);

  const oceanusFolkSongs = useMemo(() => {
    return new Set(
      nodes.filter(n =>
        (n.genre === "Oceanus Folk") &&
        (getNodeType(n) === "Song" || getNodeType(n) === "Album") &&
        !isNaN(+n.release_date) &&
        +n.release_date >= minYear &&
        +n.release_date <= maxYear
      ).map(n => n.id)
    );
  }, [nodes, minYear, maxYear]);

  const influenceLinks = useMemo(() => {
    return links.filter(link => {
      const edgeType = getEdgeType(link);
      const sourceNode = nodeById.get(link.source);
      const targetNode = nodeById.get(link.target);
      if (!sourceNode || !targetNode) return false;
      return (
        selectedInfluenceTypes.has(edgeType) &&
        oceanusFolkSongs.has(link.target)
      );
    });
  }, [links, selectedInfluenceTypes, oceanusFolkSongs, nodeById]);

  const influenceTargets = useMemo(() =>
    new Set(influenceLinks.map(link => link.source)), [influenceLinks]);

  const songPerformers = useMemo(() => {
    const map = new Map();
    links.forEach(link => {
      if (CONTRIBUTOR_EDGE_TYPES.has(getEdgeType(link))) {
        const songId = link.target;
        const performerId = link.source;
        if (!map.has(songId)) map.set(songId, new Set());
        map.get(songId).add(performerId);
      }
    });
    return map;
  }, [links]);

  const performerNotableCounts = useMemo(() => {
    const counts = new Map();
    links.forEach(link => {
      if (!CONTRIBUTOR_EDGE_TYPES.has(getEdgeType(link))) return;
      const performer = link.source;
      const work = nodeById.get(link.target);
      if (!work || !work.notable) return;
      counts.set(performer, (counts.get(performer) || 0) + 1);
    });
    return counts;
  }, [links, nodeById]);

  const preliminaryPerformerLinks = useMemo(() => {
    return links.filter(link => {
      if (!CONTRIBUTOR_EDGE_TYPES.has(getEdgeType(link))) return false;
      const songNode = nodeById.get(link.target);
      if (!songNode) return false;
      if (!showOceanusFolk && songNode.genre === "Oceanus Folk") return false;
      if (songNode.genre !== "Oceanus Folk") {
        const performerNotables = performerNotableCounts.get(link.source) || 0;
        if (performerNotables < minNotables) return false;
      }
      const sourceNode = nodeById.get(link.source);
      if (getNodeType(sourceNode) === "RecordLabel") return false;
      return true;
    });
  }, [links, nodeById, showOceanusFolk, performerNotableCounts, minNotables]);

  const preliminaryPerformerIds = useMemo(() => new Set(preliminaryPerformerLinks.map(link => link.source)), [preliminaryPerformerLinks]);

  const filteredSongsFinal = useMemo(() => {
    const baseSongs = new Set([...oceanusFolkSongs, ...influenceTargets]);
    const validSongs = new Set();
    baseSongs.forEach(songId => {
      const performers = songPerformers.get(songId);
      if (!performers) {
        validSongs.add(songId);
      } else {
        const hasVisiblePerformer = [...performers].some(p => preliminaryPerformerIds.has(p));
        if (hasVisiblePerformer) validSongs.add(songId);
      }
    });
    return validSongs;
  }, [oceanusFolkSongs, influenceTargets, songPerformers, preliminaryPerformerIds]);

  const filteredPerformerLinks = useMemo(() =>
    preliminaryPerformerLinks.filter(link => filteredSongsFinal.has(link.target)),
    [preliminaryPerformerLinks, filteredSongsFinal]
  );

  const performerIds = useMemo(() =>
    new Set(filteredPerformerLinks.map(link => link.source)),
    [filteredPerformerLinks]
  );

  const visibleNodeIds = useMemo(() =>
    new Set([...filteredSongsFinal, ...performerIds]),
    [filteredSongsFinal, performerIds]
  );

  const graphNodes = useMemo(() => {
    return Array.from(visibleNodeIds).map(id => {
      const n = nodeById.get(id);
      if (!n || (!showOceanusFolk && n.genre === "Oceanus Folk")) return null;
      if (getNodeType(n) === "RecordLabel") return null;
      if (performerIds.has(id)) {
        const performed = filteredPerformerLinks.find(l => l.source === id);
        const genreFromSong = performed ? nodeById.get(performed.target)?.genre : null;
        return {
          id,
          name: n.name || id,
          group: getNodeType(n) || "Performer",
          genre: genreFromSong || n.genre
        };
      }
      return {
        id,
        name: n.name || id,
        group: getNodeType(n),
        genre: n.genre
      };
    }).filter(Boolean);
  }, [visibleNodeIds, nodeById, performerIds, filteredPerformerLinks, showOceanusFolk]);

  const influenceAndPerformerLinks = useMemo(() =>
    [...influenceLinks, ...filteredPerformerLinks].filter(link =>
      graphNodes.find(n => n.id === link.source) &&
      graphNodes.find(n => n.id === link.target)
    ).map(link => ({
      source: link.source,
      target: link.target,
      edgeType: getEdgeType(link)
    })), [influenceLinks, filteredPerformerLinks, graphNodes]);

  useEffect(() => {
    if (!fgRef.current) return;
    fgRef.current.d3Force('charge').strength(-5);
    fgRef.current.d3Force('link').distance(80);
    fgRef.current.d3Force('collision', forceCollide(10));
    fgRef.current.d3Force('charge').simulation?.alpha(1).restart();
  }, [graphNodes, influenceAndPerformerLinks]);

  const legendStyle = {
    display: 'flex',
    gap: '10px',
    fontSize: 10,
    marginBottom: '10px',
    flexWrap: 'wrap',
    backgroundColor: 'white',
    padding: '7px',
    borderRadius: '5px',
    maxWidth: 680
  };

  const box = (color) => ({
    display: 'inline-block',
    width: '12px',
    height: '12px',
    backgroundColor: color,
    marginRight: '5px'
  });

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
      <div style={{ maxWidth: 150, maxHeight: 200, overflowY: 'auto' }}>
        <ArtistSelector
          options={graphNodes.filter(n => performerIds.has(n.id)).sort((a, b) => a.name.localeCompare(b.name))}
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
          <div><span style={{ ...box("#666"), borderRadius: '50%' }} /> Artist</div>
          <div><span style={{ ...box("#666"), clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} /> Group</div>
          <div><span style={{ ...box("#666"), clipPath: 'inset(0)' }} /> Album</div>
          <div><span style={{ ...box("#666"), clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} /> Song</div>
          {Object.entries(influenceTypeColors).map(([type, color]) => (
            <div key={type}><span style={{ ...box(color) }} /> {type}</div>
          ))}
        </div>

        <ForceGraph2D
          ref={fgRef}
          graphData={{ nodes: graphNodes, links: influenceAndPerformerLinks }}
          nodeLabel={node => `${node.name} (${node.genre || node.group})`}
          linkLabel={link => `Influence Type: ${link.edgeType}`}
          linkWidth={link => selectedInfluenceTypes.has(link.edgeType) ? 4 : 1.5}
          linkColor={link => {
            const color = d3.color(influenceTypeColors[link.edgeType] || '#4d4d4d');
            color.opacity = selectedInfluenceTypes.has(link.edgeType) ? 0.55 : 0.2;
            return color.formatRgb();
          }}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const fontSize = (focusedNodeId === node.id ? 15 : 10) / globalScale;
            ctx.font = `${focusedNodeId === node.id ? "bold " : ""}${fontSize}px Sans-Serif`;
            ctx.fillStyle = genreColor(node.genre);

            const drawTriangle = () => {
              ctx.beginPath();
              ctx.moveTo(node.x, node.y - 7);
              ctx.lineTo(node.x - 6, node.y + 5);
              ctx.lineTo(node.x + 6, node.y + 5);
              ctx.closePath();
              ctx.fill();
            };

            const drawStar = () => {
              const spikes = 5, outerRadius = 6, innerRadius = 3;
              let rot = Math.PI / 2 * 3, x = node.x, y = node.y, step = Math.PI / spikes;
              ctx.beginPath();
              ctx.moveTo(x, y - outerRadius);
              for (let i = 0; i < spikes; i++) {
                x = node.x + Math.cos(rot) * outerRadius;
                y = node.y + Math.sin(rot) * outerRadius;
                ctx.lineTo(x, y);
                rot += step;
                x = node.x + Math.cos(rot) * innerRadius;
                y = node.y + Math.sin(rot) * innerRadius;
                ctx.lineTo(x, y);
                rot += step;
              }
              ctx.lineTo(node.x, node.y - outerRadius);
              ctx.closePath();
              ctx.fill();
            };

            switch (node.group) {
              case "Artist":
                ctx.beginPath();
                ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI);
                ctx.fill();
                break;
              case "MusicalGroup":
                drawStar();
                break;
              case "Album":
                ctx.fillRect(node.x - 5, node.y - 5, 10, 10);
                break;
              case "Song":
                drawTriangle();
                break;
              default:
                ctx.beginPath();
                ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI);
                ctx.fill();
            }

            ctx.fillStyle = "#4d4d4d";
            ctx.fillText(node.name, node.x + 6, node.y + 3);
          }}
          linkDirectionalArrowLength={15}
          linkDirectionalArrowRelPos={1}
          width={700}
          height={300}
        />
      </div>

      <div style={{
        marginLeft: -145,
        marginTop: 50,
        backgroundColor: 'white',
        padding: '5px',
        borderRadius: '4px',
        zIndex: 9999,
        position: 'relative'
      }}>
        <label style={{ fontSize: 10, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showOceanusFolk}
            onChange={() => setOceanusFolkNodes(!showOceanusFolk)}
            style={{ cursor: 'pointer' }}
          />
          {' '}Show Oceanus Folk
        </label>
      </div>
    </div>
  );
}
