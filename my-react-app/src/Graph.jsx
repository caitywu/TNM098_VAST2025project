// src/Graph.jsx
import React, { useEffect, useRef, useMemo } from "react";
import * as d3 from "d3";

const EDGE_DESCRIPTIONS = {
  PerformerOf: (s, t) => `${s} performed ${t}`,
  ComposerOf: (s, t) => `${s} composed ${t}`,
  ProducerOf: (s, t) => `${s} produced ${t}`,
  LyricistOf: (s, t) => `${s} wrote lyrics for ${t}`,
  RecordedBy: (s, t) => `${t} was recorded by ${s}`,
  DistributedBy: (s, t) => `${t} aided in distribution of ${s}`,
  InStyleOf: (s, t) => `${s} was performed (partly) in the style of ${t}`,
  InterpolatesFrom: (s, t) => `${s} interpolates a melody from ${t}`,
  CoverOf: (s, t) => `${s} is a cover of ${t}`,
  LyricalReferenceTo: (s, t) => `${s} makes a lyrical reference to ${t}`,
  DirectlySamples: (s, t) => `${s} directly samples ${t}`,
  MemberOf: (s, t) => `${s} was/is a member of ${t}`,
};

export default function Graph({
  graph,
  visibleEdgeTypes,
  visibleNodeTypes,
  selectedNodeId,
  onNodeClick,
}) {
  const svgRef = useRef();
  const simRef = useRef();
  const zoomRef = useRef();
  const tooltipRef = useRef();
  const width = 800,
    height = 600;

  const filteredNodes = graph.nodes.filter((n) =>
    visibleNodeTypes.has(n["Node Type"])
  );
  const nodeIds = new Set(filteredNodes.map((n) => n.id));

  // ─── 1) Memoisera linkData ─────────────────────────
  const linkData = useMemo(() => {
    return graph.links
      .filter(
        (l) =>
          visibleEdgeTypes.has(l["Edge Type"]) &&
          nodeIds.has(l.source) &&
          nodeIds.has(l.target)
      )
      .map((l) => ({
        sourceId: l.source,
        targetId: l.target,
        edgeType: l["Edge Type"],
        source: filteredNodes.find((n) => n.id === l.source),
        target: filteredNodes.find((n) => n.id === l.target),
      }));
  }, [graph.links, filteredNodes, visibleEdgeTypes, nodeIds]);

  // ─── 2) Memoisera edgeGroups ─────────────────────────
  const edgeGroups = useMemo(() => {
    return d3.group(linkData, (d) =>
      [d.source.id, d.target.id].sort().join("__")
    );
  }, [linkData]);

  // ─── 3) Zoom‐init (kör bara en gång) ─────────────────
  useEffect(() => {
    zoomRef.current = d3
      .zoom()
      .scaleExtent([0.1, 5])
      .on("zoom", (e) =>
        d3
          .select(svgRef.current)
          .select("g.content")
          .attr("transform", e.transform)
      );
    d3.select(svgRef.current).call(zoomRef.current);
  }, []);

  // ─── 4) Tooltip‐init (kör bara en gång) ────────────────
  useEffect(() => {
    if (!tooltipRef.current) {
      tooltipRef.current = d3
        .select("body")
        .append("div")
        .attr("class", "edge-tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "white")           // white box
.style("border", "1px solid #ccc")      // subtle border
.style("padding", "8px")                // spacing
.style("border-radius", "4px")          // rounded corners
.style("box-shadow", "0px 2px 6px rgba(0,0,0,0.2)"); // soft shadow;
    }
  }, []);

  // ─── 5) Simulation + tick ────────────────────────────
  useEffect(() => {
    if (!graph.nodes.length) return;
    simRef.current?.stop();

    // Custom force to pull selected node to center
    function forceFocus(alpha) {
      if (!selectedNodeId) return;
      const n = graph.nodes.find((d) => d.id === selectedNodeId);
      if (n) {
        const str = 0.01 * alpha;
        n.vx += (width / 2 - n.x) * str;
        n.vy += (height / 2 - n.y) * str;
      }
    }

    // Tick‐handler
    function ticked() {
      const svg = d3.select(svgRef.current);
      // Rita om kanter
      svg
        .selectAll("path.edge")
        .attr("d", (d) => {
          const key = [d.source.id, d.target.id].sort().join("__");
          const grp = edgeGroups.get(key);
          const idx = grp.indexOf(d),
            cnt = grp.length,
            curve = (idx - (cnt - 1) / 2) * 6;
          const { x: x1, y: y1 } = d.source;
          const { x: x2, y: y2 } = d.target;
          const mx = (x1 + x2) / 2,
            my = (y1 + y2) / 2;
          const dx = y2 - y1,
            dy = x1 - x2,
            len = Math.hypot(dx, dy) || 1;
          const ux = dx / len,
            uy = dy / len;
          const cx = mx + ux * curve,
            cy = my + uy * curve;
          return `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`;
        })
        // uppdatera gradient‐endpoints
        .each((d) => {
          svg
            .select(`#grad-${d.source.id}-${d.target.id}-${d.edgeType}`)
            .attr("x1", d.source.x)
            .attr("y1", d.source.y)
            .attr("x2", d.target.x)
            .attr("y2", d.target.y);
        });

      // Rita om noder
      svg
        .selectAll("path.node")
        .attr("transform", (d) => `translate(${d.x},${d.y})`);

      // Rita om labels
      svg
        .selectAll("text.label")
        .attr("x", (d) => d.x)
        .attr("y", (d) => d.y);
    }

    const sim = d3
      .forceSimulation(graph.nodes)
      .force(
        "link",
        d3
          .forceLink(linkData)
          .id((d) => d.id)
          .distance(120)
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("focus", forceFocus)
      .on("tick", ticked);

    simRef.current = sim;
    return () => sim.stop();
  }, [graph.nodes, linkData, edgeGroups, selectedNodeId]);

  // ─── 6) SVG‐struktur: defs + grupper + bind data ───────
  useEffect(() => {
    if (!graph.nodes.length) return;
    const svg = d3.select(svgRef.current);
    // Rensa gamla gradients och innehåll
    svg.selectAll("defs, g.content").remove();

    // 6a) Gradients
    const defs = svg.append("defs");
    linkData.forEach((d) => {
      const id = `grad-${d.source.id}-${d.target.id}-${d.edgeType}`;
      const lg = defs
        .append("linearGradient")
        .attr("id", id)
        .attr("gradientUnits", "userSpaceOnUse");
      lg.append("stop").attr("offset", "0%").attr("stop-color", "blue");
      lg.append("stop").attr("offset", "50%").attr("stop-color", "white");
      lg.append("stop").attr("offset", "100%").attr("stop-color", "red");
    });

    // 6b) Huvudcontainer
    const container = svg.append("g").attr("class", "content");
    let pinned = false;

    // 6c) Edges
    container
      .append("g")
      .attr("class", "edges")
      .selectAll("path.edge")
      .data(
        linkData,
        (d, i) => `${d.source.id}-${d.target.id}-${d.edgeType}-${i}`
      )
      .join("path")
      .attr("class", "edge")
      .attr("fill", "none")
      .attr("stroke-width", 1)
      .attr(
        "stroke",
        (d) => `url(#grad-${d.source.id}-${d.target.id}-${d.edgeType})`
      )
      .style("opacity", 0.6)
      .on("mouseover", (e, d) => {
        const src = d.source.name || d.source.stage_name || d.source.id;
        const tgt = d.target.name || d.target.stage_name || d.target.id;
        const desc =
          EDGE_DESCRIPTIONS[d.edgeType] ||
          ((s, t) => `${d.edgeType}: ${s}→${t}`);
        tooltipRef.current.style("visibility", "visible").text(desc(src, tgt));
      })
      .on("mousemove", (e) =>
        tooltipRef.current
          .style("top", `${e.pageY + 8}px`)
          .style("left", `${e.pageX + 8}px`)
      )
      .on("mouseout", () => {
        if (!pinned) {
          tooltipRef.current.style("visibility", "hidden");
        }})
      .on("click", (e, d) => {
  const src = d.source.name || d.source.stage_name || d.source.id;
  const tgt = d.target.name || d.target.stage_name || d.target.id;
  const desc = EDGE_DESCRIPTIONS[d.edgeType] || ((s, t) => `${d.edgeType}: ${s}→${t}`);
  const html = desc(src, tgt);

  // Create a new pinned tooltip div
  const pinnedTooltip = d3
    .select("body")
    .append("div")
    .attr("class", "edge-tooltip pinned-tooltip")
    .style("position", "absolute")
    .style("top", `${e.pageY + 8}px`)
    .style("left", `${e.pageX + 8}px`)
    .style("background", "white")
    .style("border", "1px solid #ccc")
    .style("padding", "8px")
    .style("border-radius", "4px")
    .style("box-shadow", "0px 2px 6px rgba(0,0,0,0.2)")
    .html(`
  <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
    <span>${html}</span>
    <button class="close-tooltip" style="background: none; border: none; font-size: 14px; cursor: pointer; padding: 0; margin: 0;">✖</button>
  </div>
`);

  // Add close button behavior
  pinnedTooltip.select(".close-tooltip").on("click", () => {
    pinnedTooltip.remove();
  });
});


    // 6d) Nodes
    const shapeMap = {
      Person: d3.symbolCircle,
      Song: d3.symbolTriangle,
      Album: d3.symbolSquare,
      MusicalGroup: d3.symbolStar,
      RecordLabel: d3.symbolDiamond,
    };
    const symGen = d3
      .symbol()
      .type((d) => shapeMap[d["Node Type"]] || d3.symbolCircle)
      .size((d) => (d.id === selectedNodeId ? 600 : 200));

    container
      .append("g")
      .attr("class", "nodes")
      .selectAll("path.node")
      .data(filteredNodes, (d) => d.id)
      .join("path")
      .attr("class", "node")
      .attr("d", symGen)
      .attr("fill", (d) => {
        switch (d["Node Type"]) {
          case "RecordLabel":
            return "#ffffcc";
          case "Song":
            return "#c2e699";
          case "Person":
            return "#006837";
          case "Album":
            return "#31a354";
          case "MusicalGroup":
            return "#78c679";
          default:
            return "#A9A9A9";
        }
      })
      .attr("stroke", "black")
      .style("cursor", "pointer")
      .on("click", (e, d) => onNodeClick(d))
      .call(
        d3
          .drag()
          .on("start", (evt) => {
            if (!evt.active) simRef.current.alphaTarget(0.3).restart();
            evt.subject.fx = evt.subject.x;
            evt.subject.fy = evt.subject.y;
          })
          .on("drag", (evt) => {
            evt.subject.fx = evt.x;
            evt.subject.fy = evt.y;
          })
          .on("end", (evt) => {
            if (!evt.active) simRef.current.alphaTarget(0);
            evt.subject.fx = null;
            evt.subject.fy = null;
          })
      );

    // 6e) Labels
    container
      .append("g")
      .attr("class", "labels")
      .selectAll("text.label")
      .data(filteredNodes, (d) => d.id)
      .join("text")
      .attr("class", "label")
      .text((d) => d.name || d.stage_name || d.id)
      .attr("font-size", (d) => (d.id === selectedNodeId ? 12 : 8))
      .attr("dx", 6)
      .attr("dy", 2)
      .attr("font-weight", (d) =>
        d.id === selectedNodeId ? "bold" : "normal"
      );
  }, [linkData, graph.nodes, selectedNodeId, onNodeClick]);


  return (
    <svg
      ref={svgRef}
      style={{ width: "100%", height: "100%", display: "block" }}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
    />
  );
}
