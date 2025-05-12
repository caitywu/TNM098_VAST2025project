import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function Graph({
  graph,
  selectedArtistIds,
  selectedNodeId,
  visibleEdgeTypes,
  onNodeClick,
}) {
  const svgRef = useRef();
  const simRef = useRef();

  const tooltip = d3
    .select("body")
    .append("div")
    .style("position", "absolute")
    .style("padding", "4px 8px")
    .style("background", "rgba(0,0,0,0.7)")
    .style("color", "#fff")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("visibility", "hidden");

  useEffect(() => {
    if (!graph.nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800,
      height = 600;
    svg.attr("viewBox", [0, 0, width, height]);

    const container = svg.append("g");
    svg.call(
      d3
        .zoom()
        .scaleExtent([0.1, 5])
        .on("zoom", (event) => container.attr("transform", event.transform))
    );

    // Filter by visible edge‐types
    const filtered = graph.links.filter((l) =>
      visibleEdgeTypes.has(l["Edge Type"])
    );

    // Group parallel edges (same pair) so we can offset them
    const parallelGroups = d3.group(filtered, (l) =>
      [l.source, l.target].sort().join("__")
    );

    // Create a <defs> section for link‐gradients
    const defs = svg.append("defs");

    filtered.forEach((l) => {
      const id = `grad-${l.source}-${l.target}-${l["Edge Type"]}`;
      const grad = defs
        .append("linearGradient")
        .attr("id", id)
        .attr("gradientUnits", "userSpaceOnUse")
        // we’ll update x1,y1,x2,y2 in ticked() to match link endpoints
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", width)
        .attr("y2", height);

      grad.append("stop").attr("offset", "0%").attr("stop-color", "blue");
      grad.append("stop").attr("offset", "100%").attr("stop-color", "red");
    });

    const link = container
      .append("g")
      .selectAll("path")
      .data(
        filtered,
        (d, i) => `${d.source}-${d.target}-${d["Edge Type"]}-${i}`
      )
      .join("path")
      .attr("fill", "none")
      .attr("stroke-width", 2)
      .attr(
        "stroke",
        (d) => `url(#grad-${d.source}-${d.target}-${d["Edge Type"]})`
      )
      .style("opacity", 0.7)
      .on("mouseover", (e, d) => {
        tooltip.style("visibility", "visible").text(d["Edge Type"]);
      })
      .on("mousemove", (e) => {
        tooltip
          .style("top", `${e.pageY + 10}px`)
          .style("left", `${e.pageX + 10}px`);
      })
      .on("mouseout", () => tooltip.style("visibility", "hidden"));

    simRef.current?.stop();

    const links = graph.links.map((l) => ({
      ...l,
      source: graph.nodes.find((n) => n.id === l.source),
      target: graph.nodes.find((n) => n.id === l.target),
    }));

    const sim = d3
      .forceSimulation(graph.nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance(150)
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .on("tick", ticked);
    simRef.current = sim;

    // Link lines
    container
      .append("g")
      .attr("stroke", "#aaa")
      .selectAll("line")
      .data(links, (d) => `${d.source.id}:${d.target.id}`)
      .join("line")
      .attr("stroke-width", 1.2);

    // 1) Node‐type → symbol type map
    const shapeMap = {
      Person: d3.symbolCircle,
      Song: d3.symbolTriangle,
      Album: d3.symbolSquare,
      MusicalGroup: d3.symbolStar,
      RecordLabel: d3.symbolDiamond,
    };

    // 2) Symbol generator with dynamic size
    const symGen = d3
      .symbol()
      .type((d) => shapeMap[d["Node Type"]] || d3.symbolCircle)
      .size((d) => (d.id === selectedNodeId ? 300 : 50));

    // 3) Draw nodes as <path>
    const nodeSel = container
      .append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.2)
      .selectAll("path")
      .data(graph.nodes, (d) => d.id)
      .join("path")
      .attr("d", symGen)
      .attr("fill", (d) => {
        switch (d["Node Type"]) {
          case "RecordLabel":
            return "#95a5a6";
          case "Song":
            return "#2ecc71";
          case "Person":
            return "#3498db";
          case "Album":
            return "#e91e63";
          case "MusicalGroup":
            return "#9b59b6";
          default:
            return "#7f8c8d";
        }
      })
      .style("cursor", "pointer")
      .on("click", (e, d) => onNodeClick(d))
      .call(
        d3
          .drag()
          .on("start", (evt) => {
            if (!evt.active) sim.alphaTarget(0.3).restart();
            evt.subject.fx = evt.subject.x;
            evt.subject.fy = evt.subject.y;
          })
          .on("drag", (evt) => {
            evt.subject.fx = evt.x;
            evt.subject.fy = evt.y;
          })
          .on("end", (evt) => {
            if (!evt.active) sim.alphaTarget(0);
            evt.subject.fx = null;
            evt.subject.fy = null;
          })
      );

    // Labels
    const labelSel = container
      .append("g")
      .selectAll("text")
      .data(graph.nodes, (d) => d.id)
      .join("text")
      .text((d) => d.name || d.stage_name || d.id)
      .attr("font-size", 9)
      .attr("dx", 8)
      .attr("dy", 3);

    // Tick handler: reposition everything
    function ticked() {
      container
        .selectAll("line")
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      nodeSel.attr("transform", (d) => `translate(${d.x},${d.y})`);

      labelSel.attr("x", (d) => d.x).attr("y", (d) => d.y);

      link.attr("d", (d) => {
        const grp = parallelGroups.get(
          [d.source.id, d.target.id].sort().join("__")
        );
        const idx = grp.indexOf(d);
        const n = grp.length;

        // offset radie
        const offset = (idx - (n - 1) / 2) * 10;

        // use a simple quadratic Bezier
        const sx = d.source.x,
          sy = d.source.y;
        const tx = d.target.x,
          ty = d.target.y;
        const mx = (sx + tx) / 2;
        const my = (sy + ty) / 2;
        // perpendicular offset vector
        const dx = ty - sy;
        const dy = sx - tx;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;

        const cx = mx + ux * offset;
        const cy = my + uy * offset;

        return `M${sx},${sy} Q${cx},${cy} ${tx},${ty}`;
      });

      link.each(function (d) {
        d3.select(`#grad-${d.source.id}-${d.target.id}-${d["Edge Type"]}`)
          .attr("x1", d.source.x)
          .attr("y1", d.source.y)
          .attr("x2", d.target.x)
          .attr("y2", d.target.y);
      });
    }

    return () => sim.stop();
  }, [graph, selectedArtistIds, selectedNodeId, onNodeClick]);

  return <svg ref={svgRef} width="800" height="600" />;
}
