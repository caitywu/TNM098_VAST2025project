import React, { useMemo, useState, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { forceCollide } from 'd3-force';
import ForceGraph2D from 'react-force-graph-2d';
import ArtistSelector from '../ArtistSelector';

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

// Colors ofr influence types
const influenceTypeColors = {
  InStyleOf: "#ff33cc",
  CoverOf: "#fc8d62",
  DirectlySamples: "#66c2a5",
  LyricalReferenceTo: "#984ea3",
  InterpolatesFrom: "#e78ac3"
};

// Node and edge type getters with normalization
const getEdgeType = (link) => link.edgeType || link["Edge Type"];
const getNodeType = (node) => node.nodeType || node["Node Type"];



/**
 * A force graph showing what notable artists have taken influence from Oceanus Folk songs/albums. <br />
 * Can filter by year, influlence type and number of notables an artist/group has over all time. 
 * @param {object} props Component props
 * @param {array} props.nodes Array of nodes from dataset
 * @param {array} props.links Array of edges from dataset 
 * @param {Set<string>} props.selectedInfluenceTypes Set of valid influence type edges
 * @param {number} [props.minNotables=0] Minimum number of notables for a performer to be filtered in
 * 
 * @returns {JSX.Element} The rendered network with legend, checkbox and # of notables slider
 */
export default function NotableArtistNetworkGraph({
  nodes, links, yearRange, selectedInfluenceTypes, minNotables = 0
}) {
  // States for node focus + artist selection + oceanus folk visibility + time filtering
  const [focusedNodeId, setFocusedNodeId] = useState(null);
  const [selectedArtistIds, setSelectedArtistIds] = useState([]);
  const [showOceanusFolk, setOceanusFolkNodes] = useState(true);
  const fgRef = useRef();
  const [minYear, maxYear] = yearRange;

  // Filter nodes by selected artist IDs
  const nodeById = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);

  // Extract oceanus folk songs/albums in year range
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

  // Filter links based on selected influence types and oceanus folk songs
  const influenceLinks = useMemo(() => {
  return links.filter(link => {
    const edgeType = getEdgeType(link);
    const sourceNode = nodeById.get(link.source);
    const targetNode = nodeById.get(link.target);
    if (!sourceNode || !targetNode) return false;

    return (
      selectedInfluenceTypes.has(edgeType) &&
      oceanusFolkSongs.has(link.target) // Oceanus Folk as influence source (i.e., target of edge)
    );
  });
  }, [links, selectedInfluenceTypes, oceanusFolkSongs, nodeById]);
  
  const influenceTargets = useMemo(() => {
  return new Set(influenceLinks.map(link => link.source)); // who was influenced
}, [influenceLinks]);

  // Map from song/album ID to Set of performer IDs
  const songPerformers = useMemo(() => {
    const map = new Map();
    links.forEach(link => {
      if (getEdgeType(link) === "PerformerOf") {
        const songId = link.target;
        const performerId = link.source;
        if (!map.has(songId)) map.set(songId, new Set());
        map.get(songId).add(performerId);
      }
    });
    return map;
  }, [links]);

  // Count notable works per performer
  const performerNotableCounts = useMemo(() => {
    const counts = new Map();
    links.forEach(link => {
      if (getEdgeType(link) !== "PerformerOf") return;
      const performer = link.source;
      const work = nodeById.get(link.target);
      if (!work || !work.notable) return;
      counts.set(performer, (counts.get(performer) || 0) + 1);
    });
    return counts;
  }, [links, nodeById]);

  // Filter out songs and performers based on # of notables
  const filteredSongs = useMemo(() => {
    const baseSongs = new Set([...oceanusFolkSongs, ...influenceTargets]);
    const validSongs = new Set();

    return validSongs;
  }, [oceanusFolkSongs, influenceTargets, songPerformers]);

  // Performer links filtered with minNotables and oceanus folk filtering
  const performerLinks = useMemo(() => {
    return links.filter(link => {
      if (getEdgeType(link) !== "PerformerOf") return false;
      const songNode = nodeById.get(link.target);
      if (!songNode) return false;

      return true; 
    });
  }, [links, nodeById, showOceanusFolk, performerNotableCounts, minNotables]);

  // Compute performerLinks without filtering 
  const preliminaryPerformerLinks = useMemo(() => {
    return links.filter(link => {
      if (getEdgeType(link) !== "PerformerOf") return false;
      const songNode = nodeById.get(link.target);
      if (!songNode) return false;

      if (!showOceanusFolk && songNode.genre === "Oceanus Folk") return false;

      if (songNode.genre !== "Oceanus Folk") {
        const performerNotables = performerNotableCounts.get(link.source) || 0;
        if (performerNotables < minNotables) return false;
      }

      return true;
    });
  }, [links, nodeById, showOceanusFolk, performerNotableCounts, minNotables]);

  // Get performerIds from preliminaryPerformerLinks
  const preliminaryPerformerIds = useMemo(() => new Set(preliminaryPerformerLinks.map(link => link.source)), [preliminaryPerformerLinks]);

  // Define filtered songs/albums from notables
  const filteredSongsFinal = useMemo(() => {
    const baseSongs = new Set([...oceanusFolkSongs, ...influenceTargets]);
    const validSongs = new Set();

    baseSongs.forEach(songId => {
      const performers = songPerformers.get(songId);
      if (!performers) {
        // Keep only if Oceanus Folk or influence target
        validSongs.add(songId);
      } else {
        // Keep song/album if at least one performer is visible after filtering
        const hasVisiblePerformer = [...performers].some(p => preliminaryPerformerIds.has(p));
        if (hasVisiblePerformer) validSongs.add(songId);
      }
    });

    return validSongs;
  }, [oceanusFolkSongs, influenceTargets, songPerformers, preliminaryPerformerIds]);

  // Filter performerLinks on songs/alnums in filteredSongsFinal
  const filteredPerformerLinks = useMemo(() => {
    return preliminaryPerformerLinks.filter(link => filteredSongsFinal.has(link.target));
  }, [preliminaryPerformerLinks, filteredSongsFinal]);

  // Get final performerIds from filteredPerformerLinks
  const performerIds = useMemo(() => new Set(filteredPerformerLinks.map(link => link.source)), [filteredPerformerLinks]);


  const visibleNodeIds = useMemo(() => new Set([
    ...filteredSongsFinal,
    ...performerIds
  ]), [filteredSongsFinal, performerIds]);

  // Get those nodes that should be rendered
  const graphNodes = useMemo(() => {
    return Array.from(visibleNodeIds).map(id => {
      const n = nodeById.get(id);
      if (!n || (!showOceanusFolk && n.genre === "Oceanus Folk")) return null;

      // Get artist/group genre
      if (performerIds.has(id)) {
        const performed = filteredPerformerLinks.find(l => l.source === id);
        const genreFromSong = performed ? nodeById.get(performed.target)?.genre : null;
        return {
          id,
          name: n.name || id,
          group: "performer",
          genre: genreFromSong || n.genre
        };
      }

      return {
        id,
        name: n.name || id,
        group: "song",
        genre: n.genre
      };
    }).filter(Boolean);
  }, [visibleNodeIds, nodeById, performerIds, filteredPerformerLinks, showOceanusFolk]);

  // Filter out links that are not in the graph
  const influenceAndPerformerLinks = useMemo(() => {
    return [
      ...influenceLinks,
      ...filteredPerformerLinks
    ].filter(link =>
      graphNodes.find(n => n.id === link.source) &&
      graphNodes.find(n => n.id === link.target)
    ).map(link => ({
      source: link.source,
      target: link.target,
      edgeType: getEdgeType(link)
    }));
  }, [influenceLinks, filteredPerformerLinks, graphNodes]);

  // Set the force graph simulation parameters, -1 makes it tight but messy
  useEffect(() => {
    if (!fgRef.current) return;
    fgRef.current.d3Force('charge').strength(-5);
    fgRef.current.d3Force('link').distance(80);
    fgRef.current.d3Force('collision', forceCollide(10));
    fgRef.current.d3Force('charge').simulation?.alpha(1).restart();
  }, [graphNodes, influenceAndPerformerLinks]);

  // Style legend
  const legendStyle = {
    display: 'flex',
    gap: '10px',
    fontSize: 10,
    marginBottom: '10px',
    flexWrap: 'wrap', 
    backgroundColor: 'white', 
    padding: '7px',
    borderRadius: '5px'
  };

  // Legend box style
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
        {/* List of artists/groups for selection */}
        <ArtistSelector
          options={graphNodes.filter(n => n.group === 'performer').sort((a, b) => a.name.localeCompare(b.name))}
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
      
      {/* Render legend */}
      <div>
        <div style={legendStyle}>
          <div><span style={{ ...box("#666"), clipPath: 'inset(0)' }} /> Song/Album</div>
          <div><span style={{ ...box("#666"), borderRadius: '50%' }} /> Artist</div>
          {Object.entries(influenceTypeColors).map(([type, color]) => (
            <div key={type}><span style={{ ...box(color) }} /> {type}</div>
          ))}
        </div>
        
        {/* Render graph */}
        <ForceGraph2D
          ref={fgRef} // Reference to the graph
          graphData={{ nodes: graphNodes, links: influenceAndPerformerLinks }}
          nodeLabel={node => `${node.name} (${node.genre || node.group})`}
          linkLabel={link => `Influence Type: ${link.edgeType}`}

          // Adjust links based on type influence or performer
          linkWidth={link => {
            const isInfluence = link.edgeType !== "PerformerOf";
            const isSelected = selectedInfluenceTypes.has(link.edgeType);
            return isInfluence ? (isSelected ? 4 : 1.5) : 1.7;
          }}

          // Color links based on influence type
          linkColor={link => {
            const edgeType = link.edgeType;
            const baseColor = influenceTypeColors[edgeType] || '#4d4d4d';
            const isSelected = selectedInfluenceTypes.has(edgeType);
            const opacity = isSelected ? 0.55 : 0.2;

            const c = d3.color(baseColor);
            if (c) {
              c.opacity = opacity;
              return c.formatRgb();
            }
            return baseColor;
          }}
          // Color nodes based on their genre
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.name;
            const fontSize = (focusedNodeId === node.id ? 15 : 10) / globalScale;
            ctx.font = `${focusedNodeId === node.id ? "bold " : ""}${fontSize}px Sans-Serif`;

            ctx.fillStyle = genreColor(node.genre);
            if (node.group === "song") {
              ctx.fillRect(node.x - 5, node.y - 5, 10, 10);
            } else {
              ctx.beginPath();
              ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI, false);
              ctx.fill();
            }

            ctx.fillStyle = "#4d4d4d";
            ctx.fillText(label, node.x + 6, node.y + 3);
          }}
          // Sizes of edges arrows
          linkDirectionalArrowLength={15}
          linkDirectionalArrowRelPos={1}
          width={700}
          height={300}
        />
      </div>
      {/* Checkbox to show/hide oceanus folk nodes */}
      <div style={{
        marginLeft: -150,
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
