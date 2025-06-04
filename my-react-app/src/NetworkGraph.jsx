import React, { useEffect, useState } from "react";
import ArtistSelector from "./ArtistSelector";
import Graph from "./Graph";
import CombinedInfo from "./CombinedInfo";
//import TimeSeriesChart from "./TimeSeriesChart";
import EdgeFilter from "./EdgeFilter";
import TemporalInfluenceChart from "./TemporalInfluencerChart";
import InfluenceGraph from "./InfluenceGraph";
import TemporalPlot from "./TemporalPlot";
import TimeSeriesChart from "./TimeSeriesChart";

const allEdgeTypes = [
  "PerformerOf",
  "ComposerOf",
  "ProducerOf",
  "LyricistOf",
  "RecordedBy",
  "DistributedBy",
  "InStyleOf",
  "InterpolatesFrom",
  "CoverOf",
  "LyricalReferenceTo",
  "DirectlySamples",
  "MemberOf",
];

export default function NetworkGraph() {
  const [data, setData] = useState(null);
  const [artists, setArtists] = useState([]);
  const [selectedArtistIds, setIds] = useState([]);
  const [graph, setGraph] = useState({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [maxHops, setMaxHops] = useState(2); //2 connection per default
  const [debouncedArtist, setDebouncedArtist] = useState(null);

  // load & normalize
  useEffect(() => {
    fetch("/MC1_graph.json")
      .then((r) => r.json())
      .then((raw) => {
        const nodes = raw.nodes.map((n) => ({ ...n, id: String(n.id) }));
        const links = raw.links.map((l) => ({
          ...l,
          source: String(l.source),
          target: String(l.target),
        }));

        const rolesByPerson = {};

        for (const link of links) {
          const type = link["Edge Type"];
          const source = link.source;
          const srcNode = nodes.find((n) => n.id === source);
          if (srcNode?.["Node Type"] === "Person") {
            if (!rolesByPerson[source]) rolesByPerson[source] = new Set();
            rolesByPerson[source].add(type);
          }
        }

        const persons = nodes
          .filter((n) => n["Node Type"] === "Person")
          .sort((a, b) =>
            (a.name || a.stage_name || "").localeCompare(
              b.name || b.stage_name || "",
              undefined,
              { sensitivity: "base" }
            )
          );

        // Add a new property: roles
        const enrichedPersons = persons.map((p) => ({
          ...p,
          roles: rolesByPerson[p.id] || new Set(),
        }));

        setData({ nodes, links });

        setArtists(enrichedPersons); // <- use enriched data
        const sailor = nodes.find((n) => n.name === "Sailor Shift");
        if (sailor) {
          setIds([sailor.id]);
          setSelectedNode(sailor);
        }
      });
  }, []);

  // dynamic hoops
  useEffect(() => {
    if (!data || selectedArtistIds.length === 0) return;
    const { nodes, links } = data;

    const reachable = new Set(selectedArtistIds);
    let frontier = new Set(selectedArtistIds);

    const linkKeys = new Set();
    const selectedLinks = [];

    for (let hop = 1; hop <= maxHops; hop++) {
      // 1) find all edges touching the current frontier
      const newLinks = links.filter(
        (l) => frontier.has(l.source) || frontier.has(l.target)
      );
      // 2) dedupe & collect
      newLinks.forEach((l) => {
        const key = `${l.source}-${l.target}-${l["Edge Type"]}`;
        if (!linkKeys.has(key)) {
          linkKeys.add(key);
          selectedLinks.push(l);
        }
      });
      // 3) build the next frontier = endpoints of those edges not yet seen
      const candidates = new Set();
      newLinks.forEach((l) => {
        candidates.add(l.source);
        candidates.add(l.target);
      });
      const prevReachable = new Set(reachable);
      frontier = new Set(
        [...candidates].filter((id) => !prevReachable.has(id))
      );
      // 4) merge into reachable
      frontier.forEach((id) => reachable.add(id));
    }

    // finally, pick the nodes and links in our n-hop neighborhood
    const subNodes = nodes.filter((n) => reachable.has(n.id));
    setGraph({ nodes: subNodes, links: selectedLinks });
  }, [data, selectedArtistIds, maxHops]);

  const handleNodeClick = (node) => {
    setSelectedNode(node);
    if (node["Node Type"] === "Person") {
      setIds([node.id]);
    }
  };

  const [visibleEdgeTypes, setVisibleEdgeTypes] = useState(
    new Set(allEdgeTypes)
  );

  const allNodeTypes = [
    "Person",
    "Song",
    "Album",
    "MusicalGroup",
    "RecordLabel",
  ];
  const [visibleNodeTypes, setVisibleNodeTypes] = useState(
    new Set(allNodeTypes)
  );

  function toggleNodeType(type) {
    setVisibleNodeTypes((prev) => {
      const s = new Set(prev);
      s.has(type) ? s.delete(type) : s.add(type);
      return s;
    });
  }

  function toggleEdgeType(type) {
    setVisibleEdgeTypes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  }

  useEffect(() => {
    const id = selectedNode ? selectedNode.id : null;
    const tid = setTimeout(() => setDebouncedArtist(id), 300);
    return () => clearTimeout(tid);
  }, [selectedNode]);

  function selectAllEdges() {
    setVisibleEdgeTypes(new Set(allEdgeTypes));
  }

  function deselectAllEdges() {
    setVisibleEdgeTypes(new Set());
  }

  const handleArtistSelect = (ids) => {
    setIds(ids);

    // if exactly one artist is selected, fire handleNodeClick on it
    if (ids.length === 1) {
      const node = data.nodes.find((n) => n.id === ids[0]);
      if (node) handleNodeClick(node);
    } else {
      // multiple artists → clear the detail panel
      setSelectedNode(null);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
      }}
    >
      {/* ─── TOP ROW: selector, network, toolbar ─── */}
      <div
        style={{
          display: "flex",
          flex: 1,
          borderBottom: "2px solid #fff",
          minHeight: 1200,
        }}
      >
        <div style={{ flex: "0 0 15%", padding: "1rem" , backgroundColor: "transparent"}}>
          <ArtistSelector
            nodes={data?.nodes || []}
            links={data?.links || []}
            selectedIds={selectedArtistIds}
            onChange={handleArtistSelect}
          />

          <div style={{ marginTop: "1rem" }}>
            <label htmlFor="hopSelect">
              <strong>Connections (1=direct links):</strong>{" "}
            </label>
            <select
              id="hopSelect"
              value={maxHops}
              onChange={(e) => setMaxHops(Number(e.target.value))}
            >
              {[1, 2, 3].map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ flex: "1 1 70%", minWidth: 800, position: "relative" }}>
          <Graph
            graph={graph}
            selectedArtistIds={selectedArtistIds}
            selectedNodeId={debouncedArtist}
            visibleEdgeTypes={visibleEdgeTypes}
            visibleNodeTypes={visibleNodeTypes}
            onNodeClick={handleNodeClick}
          />
        </div>

        <div
          style={{
            flex: "0 0 10%",
            color: "#fff",
            padding: "1rem",
          }}
        >
          <fieldset style={{ border: "0.5px solid #ccc", padding: "0.5rem" }}>
            <legend>Show nodes</legend>
            {allNodeTypes.map((t) => (
              <label key={t} style={{ display: "block", fontSize: "0.7rem" }}>
                <input
                  type="checkbox"
                  checked={visibleNodeTypes.has(t)}
                  onChange={() => toggleNodeType(t)}
                />{" "}
                {t}
              </label>
            ))}
          </fieldset>
        </div>
        <div
          style={{
            flex: "0 0 10%",
            color: "#fff",
            padding: "1rem",
          }}
        >
          <EdgeFilter
            edgeTypes={allEdgeTypes}
            visible={visibleEdgeTypes}
            onToggle={toggleEdgeType}
            onSelectAll={selectAllEdges}
            onDeselectAll={deselectAllEdges}
          />
        </div>
      </div>

      {/* ─── BOTTOM ROW: detail view 1 & 2 ─── */}
      <div style={{ display: "flex", height: 800 }}>
        <div
          style={{
            flex: 1.5,
            borderRight: "2px solid #fff",
            overflow: "auto",
            padding: "0.5rem",
            backgroundColor: "white",
          }}
        >
          {/* <InfluenceGraph
            fullGraph={graph}
            selectedId={debouncedArtist}
            onNodeClick={handleNodeClick}
          /> */}
          <TemporalPlot onNodeClick={handleNodeClick} />
        </div>

        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "0.5rem",
            background: "#888",
          }}
        >
          <CombinedInfo
            data={data}
            selectedNode={selectedNode}
            onNodeClick={handleNodeClick}
            nodes={data?.nodes || []}
          />
        </div>
      </div>
    </div>
  );
}
