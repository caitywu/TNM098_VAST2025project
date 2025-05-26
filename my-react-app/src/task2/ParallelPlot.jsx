import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

const dimensions = [
  'songs',
  'albums',
  'recordLabels',
  'notables',
  'lyricistsAndComposers',
  'artistsAndGroups',
];

function genreColor(genre) {
  if (genre === "Oceanus Folk") return "red";
  if (genre.toLowerCase().endsWith("rock")) return "#1f77b4";
  if (genre.toLowerCase().endsWith("folk")) return "#2ca02c";
  if (genre.toLowerCase().endsWith("metal")) return "#9467bd";
  if (genre.toLowerCase().endsWith("pop")) return "#ff7f0e";
  return "#000000";
}

function getGenreGroup(genre) {
  if (genre === "Oceanus Folk") return "Oceanus Folk";
  if (genre.toLowerCase().endsWith("rock")) return "Rock";
  if (genre.toLowerCase().endsWith("folk")) return "Folk";
  if (genre.toLowerCase().endsWith("metal")) return "Metal";
  if (genre.toLowerCase().endsWith("pop")) return "Pop";
  return "Other genres";
}

export default function ParallelPlot({ data, highlightedGenre, globalDomain }) {
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
    const width = 900 - margin.left - margin.right;
    const height = 150 - margin.top - margin.bottom;

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const g = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const y = {};
    for (let dim of dimensions) {
      y[dim] = d3
        .scaleLinear()
        .domain(
          globalDomain && globalDomain[dim]
            ? globalDomain[dim]
            : d3.extent(data, d => d[dim])
        )
        .range([height, 0]);
    }

    const x = d3.scalePoint().range([0, width]).domain(dimensions);

    function path(d) {
      return d3.line()(dimensions.map(p => [x(p), y[p](d[p])]));
    }

    g.selectAll("path")
      .data(data)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("stroke", d => {
        if (highlightedGenre && d.genre === highlightedGenre) return "#ffffff";
        return genreColor(d.genre);
      })
      .attr("stroke-opacity", d => {
        const group = getGenreGroup(d.genre);
        if (!selectedGroups[group]) return 0;
        if (highlightedGenre && d.genre === highlightedGenre) return 1;
        return group === "Oceanus Folk" ? 1 : 0.75;
      })
      .attr("stroke-width", d => (d.genre === "Oceanus Folk" ? 5 : 3))
      .attr("fill", "none")
      .attr("pointer-events", "visibleStroke")
      .on("mousemove", function (event, d) {
        const group = getGenreGroup(d.genre);
        if (!selectedGroups[group]) return;

        d3.select(this)
          .raise()
          .attr("stroke", "#ffffff")
          .attr("stroke-width", 4)
          .attr("stroke-opacity", 1);

        d3.select(tooltipRef.current)
          .style("visibility", "visible")
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY + 10}px`)
          .text(`Genre: ${d.genre}`);
      })
      .on("mouseout", function (event, d) {
        const group = getGenreGroup(d.genre);
        if (!selectedGroups[group]) return;

        d3.select(this)
          .attr("stroke", () =>
            highlightedGenre && d.genre === highlightedGenre
              ? "#ffffff"
              : genreColor(d.genre)
          )
          .attr("stroke-width", d.genre === "Oceanus Folk" ? 5 : 3)
          .attr("stroke-opacity", () =>
            highlightedGenre && d.genre === highlightedGenre
              ? 1
              : group === "Oceanus Folk"
              ? 1
              : 0.75
          );

        d3.select(tooltipRef.current).style("visibility", "hidden");
      });

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

    const items = legend
      .selectAll("g.legend-item")
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

    items
      .append("rect")
      .attr("width", 14)
      .attr("height", 14)
      .attr("fill", d => d.color)
      .attr("stroke", d => (selectedGroups[d.label] ? "#ccc" : "none"))
      .attr("stroke-width", 2);

    items
      .append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text(d => d.label)
      .style("font-size", "12px");
  }, [data, selectedGroups, highlightedGenre, globalDomain]);

  return (
    <div>
      <svg ref={ref}></svg>

      <div
        ref={tooltipRef}
        style={{
          position: "absolute",
          visibility: "hidden",
          backgroundColor: "#fff",
          border: "1px solid #ddd",
          padding: "8px 15px",
          borderRadius: "5px",
          pointerEvents: "none",
          fontSize: "14px",
          zIndex: 10,
          width: "auto",
          maxWidth: "200px",
        }}
      />

      <svg ref={legendRef}></svg>
    </div>
  );
}
