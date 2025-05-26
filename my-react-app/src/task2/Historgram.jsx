import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

// Functions to get genre colors for genre families
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

/**
 * A stacked histogram counting # of activities per genre per year. <br>
 * Counts include: <ul>
 * <li>Songs</li>
 * <li>Albums</li>
 * <li>Record labels</li>
 * <li>Artists + Music Groups</li>
 * <li>Notables</li>
 * <li>Lyricists + Composers</li>
 * </ul> <br>
 * The histogram has an interactive legend to show/hide genre families.
 *
 * @param {Object} Component properties
 * @param {Object} props.data - Dataset containing yearly genre activity counts from dataset
 * @param {number} [props.width=800] - Width of histogram
 * @param {number} [props.height=120] - Height of histogram
 * @param {string} [props.highlightedGenre] - Highlight selected genre
 * 
 * @returns {JSX.Element} JSX element rendering the stacked histogram with an interactive legend
 */
export default function StackedHistogram({ data, width = 800, height = 120, highlightedGenre }) {

  // Refs for SVG elements for histogram, tooltip and legend
  const ref = useRef();
  const tooltipRef = useRef();
  const legendRef = useRef();

  // State to manage genre groups selection
  const [selectedGroups, setSelectedGroups] = useState({
    Rock: true,
    Folk: true,
    Metal: true,
    Pop: true,
    "Other genres": true,
    "Oceanus Folk": true,
  });

  // Effect to update the histogram and legend when data or selected groups change
  useEffect(() => {
    if (!data) return;

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    // Clean tooltip styling using plain DOM
    const tooltipNode = tooltipRef.current;
    Object.assign(tooltipNode.style, {
      position: "absolute",
      visibility: "hidden",
      background: "white",
      border: "1px solid #ccc",
      padding: "4px 8px",
      borderRadius: "4px",
      fontSize: "10px",
      pointerEvents: "none",
      zIndex: 10,
    });

    // Histogram svg dimensions
    const margin = { top: 10, right: 20, bottom: 20, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Get the years and genres from the data and sort them
    const years = Object.keys(data).map(d => +d).sort((a, b) => a - b);
    const genres = Array.from(
      new Set(Object.values(data).flatMap(yearData => Object.keys(yearData)))
    );

    // Create a stack layout for each year on all genres
    const stackData = years.map(year => {
      const yearData = data[year];
      const entry = { year };
      genres.forEach(genre => {
        const values = yearData?.[genre] || {};
        entry[genre] = Object.values(values).reduce((sum, v) => sum + v, 0);
      });
      return entry;
    });

    // Filter out genres that are not selected
    const stack = d3.stack().keys(genres);
    const series = stack(stackData);

    // Create scales for x and y axes and bar sizes
    const x = d3.scaleBand().domain(years).range([0, innerWidth]).padding(0.2);
    const y = d3.scaleLinear()
      .domain([
        0,
        d3.max(stackData, d =>
          d3.sum(genres, g =>
            selectedGroups[getGenreGroup(g)] ? (d[g] || 0) : 0
          )
        )
      ])
      .nice()
      .range([innerHeight - 2, 0]);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Draw bars for each genre
    g.selectAll("g.layer")
      .data(series)
      .enter()
      .append("g")
      .attr("fill", d => {
        const group = getGenreGroup(d.key);
        const isSelected = selectedGroups[group];
        const isHighlighted = highlightedGenre && d.key === highlightedGenre;
        
        // Highlight the selected genre
        if (!isSelected) return "white";
        if (isHighlighted) return "white";
        return genreColor(d.key);
      })
      .style("opacity", d =>
        selectedGroups[getGenreGroup(d.key)] ? 0.9 : 0
      )
      .selectAll("rect")
      .data(d => d.map(v => ({ ...v, key: d.key })))
      .enter()
      .append("rect")
      .attr("x", d => x(d.data.year))
      .attr("y", d => y(d[1]))
      .attr("height", d => y(d[0]) - y(d[1]))
      .attr("width", x.bandwidth())
      // Tooltip  
      .on("mouseover", (event, d) => {
        const color = genreColor(d.key);
        const count = d.data[d.key] || 0;

        tooltipNode.style.visibility = "visible";
        tooltipNode.style.color = color;
        tooltipNode.innerHTML = `<strong>${d.key}</strong><br/># of activities: ${count}`;
      })
      .on("mousemove", (event) => {
        const tooltipWidth = tooltipNode.offsetWidth;
        const tooltipHeight = tooltipNode.offsetHeight;

        const x = event.pageX - tooltipWidth / 2;
        const y = event.pageY - tooltipHeight - 10;

        tooltipNode.style.left = `${x}px`;
        tooltipNode.style.top = `${y}px`;
      })
      .on("mouseout", () => {
        tooltipNode.style.visibility = "hidden";
      });

    g.append("g")
      .call(d3.axisLeft(y).ticks(3))
      .attr("font-size", "10px");

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).tickValues(years.filter((_, i) => i % 5 === 0)))
      .attr("font-size", "10px");
    
    // Interactive legend at the bottom
    const legendSvg = d3.select(legendRef.current);
    const legendWidth = 1000;
    const legendHeight = 60;

    legendSvg
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .selectAll("*")
      .remove();

    const legendData = [
      { label: "Rock", color: "#1f77b4" },
      { label: "Folk", color: "#2ca02c" },
      { label: "Metal", color: "#9467bd" },
      { label: "Pop", color: "#ff7f0e" },
      { label: "Other genres", color: "#000000" },
      { label: "Oceanus Folk", color: "red" },
    ];

    const legend = legendSvg.append("g").attr("transform", "translate(20, 20)");

    // Handle legend item clicks
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
      .attr("stroke", d => (selectedGroups[d.label] ? "#fff" : "none"))
      .attr("stroke-width", 2);

    items
      .append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text(d => d.label)
      .style("font-size", "12px");

  }, [data, highlightedGenre, selectedGroups]);

  // return histogram, legend and tooltip
  return (
    <>
      <svg ref={ref} width={width} height={height}></svg>
      <svg ref={legendRef}></svg>
      <div ref={tooltipRef}></div>
    </>
  );
}
