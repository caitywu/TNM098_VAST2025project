import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

const dimensions = [
  'songs',
  'albums',
  'recordLabels',
  'artists',
  'notables',
  'lyricistsAndComposers',
];

// Maps genre to color group
function genreColor(genre) {
  if (genre === "Oceanus Folk") return "red";
  if (genre.toLowerCase().endsWith("rock")) return "#1f77b4";    // blue
  if (genre.toLowerCase().endsWith("folk")) return "#2ca02c";    // green
  if (genre.toLowerCase().endsWith("metal")) return "#9467bd";   // purple
  if (genre.toLowerCase().endsWith("pop")) return "#ff7f0e";     // orange
  return "#000000"; // other
}

// Map genre to legend group
function getGenreGroup(genre) {
  if (genre === "Oceanus Folk") return "Oceanus Folk";
  if (genre.toLowerCase().endsWith("rock")) return "Rock";
  if (genre.toLowerCase().endsWith("folk")) return "Folk";
  if (genre.toLowerCase().endsWith("metal")) return "Metal";
  if (genre.toLowerCase().endsWith("pop")) return "Pop";
  return "Other genres";
}

export default function ParallelPlot({ data }) {
  const ref = useRef();
  const legendRef = useRef();
  const tooltipRef = useRef();

  const [selectedGroups, setSelectedGroups] = useState({
    Rock: true,
    Folk: true,
    Metal: true,
    Pop: true,
    "Other genres": true,
    "Oceanus Folk": true,
  });

  useEffect(() => {
    if (!data || data.length === 0) return;

    const margin = { top: 30, right: 40, bottom: 10, left: 60 };
    const width = 1100 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const g = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const y = {};
    for (let dim of dimensions) {
      y[dim] = d3
        .scaleLinear()
        .domain(d3.extent(data, d => d[dim]))
        .range([height, 0]);
    }

    const x = d3.scalePoint().range([0, width]).domain(dimensions);

    // Line generator
    function path(d) {
      return d3.line()(dimensions.map(p => [x(p), y[p](d[p])]));
    }

    // Draw lines
    g.selectAll("path")
        .data(data)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("stroke", d => genreColor(d.genre))
        .attr("stroke-opacity", d => {
    const group = getGenreGroup(d.genre);
    return selectedGroups[group] ? (group === "Oceanus Folk" ? 1 : 0.3) : 0;
    })
    .attr("stroke-width", d => d.genre === "Oceanus Folk" ? 3 : 100)
    .attr("fill", "none")
    // Add invisible hover target area (for easier hovering)
    .attr("stroke-width", 5)  // Increase the invisible hit area for hover detection
    .attr("pointer-events", "visibleStroke")  // Ensure the line still receives pointer events
    .on("mousemove", function (event, d) {
        const group = getGenreGroup(d.genre);
        if (!selectedGroups[group]) return;  // Don't show tooltip if line is hidden

    d3.select(tooltipRef.current)
        .style("visibility", "visible")
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY + 10}px`)
        .text(`Genre: ${d.genre}`);
  })
  .on("mouseout", () => {
    d3.select(tooltipRef.current).style("visibility", "hidden");
  });

    // Axes
    g.selectAll(".dimension")
      .data(dimensions)
      .enter()
      .append("g")
      .attr("class", "dimension")
      .attr("transform", d => `translate(${x(d)})`)
      .each(function (d) {
        d3.select(this).call(d3.axisLeft(y[d]));
      })
      .append("text")
      .style("text-anchor", "middle")
      .attr("y", -9)
      .text(d => d)
      .style("fill", "black");

    // Legend
    const legendData = [
      { label: "Rock", color: "#1f77b4" },
      { label: "Folk", color: "#2ca02c" },
      { label: "Metal", color: "#9467bd" },
      { label: "Pop", color: "#ff7f0e" },
      { label: "Other genres", color: "#000000" },
      { label: "Oceanus Folk", color: "red" },
    ];

    const legendSvg = d3.select(legendRef.current);
    const legendWidth = 1100;
    const legendHeight = 100;

    legendSvg.attr("width", legendWidth).attr("height", legendHeight).selectAll("*").remove();

    const legend = legendSvg.append("g").attr("transform", "translate(20, 20)");

    const items = legend.selectAll("g.legend-item")
      .data(legendData)
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(${i * 160}, 0)`)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        setSelectedGroups(prev => ({
          ...prev,
          [d.label]: !prev[d.label],
        }));
      });

    items.append("rect")
      .attr("width", 14)
      .attr("height", 14)
      .attr("fill", d => d.color)
      .attr("stroke", d => selectedGroups[d.label] ? "none" : "#ccc")
      .attr("stroke-width", 2);

    items.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text(d => d.label)
      .style("font-size", "12px");
  }, [data, selectedGroups]);

  return (
    <div>
      <svg ref={ref}></svg>

      {/* Tooltip */}
    <div
        ref={tooltipRef}
        style={{
            position: "absolute",
            visibility: "hidden",
            backgroundColor: "#fff",
            border: "1px solid #ddd",
            padding: "8px 15px",  // Increase padding to make the tooltip wider
            borderRadius: "5px",  // Slightly round the corners for a softer look
            pointerEvents: "none",  // Ensure it doesn't interfere with mouse events
            fontSize: "14px",       // Increase font size for better visibility
            zIndex: 10,
            width: "auto",          // Let it auto adjust to content
            maxWidth: "200px",      // Set a max width to ensure it doesn't get too wide
        }}
    />


      {/* Legend */}
      <svg ref={legendRef}></svg>
    </div>
  );
}
