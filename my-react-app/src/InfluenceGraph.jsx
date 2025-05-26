// src/InfluenceGraph.jsx
import React, { useState } from "react";
import Graph from "./Graph";

// the five “influence” edge‐types
const INFL = new Set([
  "InStyleOf",
  "InterpolatesFrom",
  "CoverOf",
  "LyricalReferenceTo",
  "DirectlySamples",
]);

export default function InfluenceGraph({ fullGraph, selectedId, onNodeClick }) {
  const [incoming, setIncoming] = useState(false);

  // nothing to show until we have a graph and a selection
  if (!fullGraph || !selectedId) return null;

  // filter either outgoing or incoming edges
  const links = fullGraph.links.filter((l) => {
    if (incoming) {
      // who influences me?
      return l.target === selectedId && INFL.has(l["Edge Type"]);
    } else {
      // who I influence?
      return l.source === selectedId && INFL.has(l["Edge Type"]);
    }
  });

  // collect all node‐ids (center + neighbors)
  const neighborIds = links.map((l) => (incoming ? l.source : l.target));
  const nodeIds = new Set([selectedId, ...neighborIds]);

  // subgraph
  const nodes = fullGraph.nodes.filter((n) => nodeIds.has(n.id));
  const subgraph = { nodes, links };

  return (
    <div>
      <div style={{ marginBottom: ".5rem" }}>
        <button onClick={() => setIncoming(false)} disabled={!incoming}>
          Influenced
        </button>
        <button
          onClick={() => setIncoming(true)}
          disabled={incoming}
          style={{ marginLeft: "0.5rem" }}
        >
          Got Influenced By
        </button>
      </div>
      <Graph
        graph={subgraph}
        // only show those 5 types in this little graph
        visibleEdgeTypes={INFL}
        selectedNodeId={selectedId}
        onNodeClick={onNodeClick}
      />
    </div>
  );
}