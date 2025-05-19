import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

// Function to compute the influence type counts 
export function computeOceanusFolkInfluenceTypeCounts(nodes, links, selectedInfluenceTypes, yearRange) {
  const [minYear, maxYear] = yearRange;
  const nodeById = new Map(nodes.map(n => [n.id, n]));
  const result = {};

  // Normalize edge type names 
  links.forEach(link => {
    const edgeType = link.edgeType || link["Edge Type"];
    if (!selectedInfluenceTypes.has(edgeType)) return;

    const source = nodeById.get(link.source);
    if (!source || source.genre !== "Oceanus Folk") return;

    const year = parseInt(source.release_date);
    if (isNaN(year) || year < minYear || year > maxYear) return;

    if (!result[year]) result[year] = {};
    if (!result[year][edgeType]) result[year][edgeType] = 0;

    // Initialize the count for the edge type if it doesn't exist, otherwise increment it
    result[year][edgeType] += 1;
  });

  return result;
}

// Colors for the influence types
const selectedColors = [
  "#ff33cc", // vivid pink
  "#fc8d62", // orange
  "#66c2a5", // teal
  "#984ea3", // magenta
];

// List of all influence types
const allInfluenceTypes = [
  "InStyleOf",
  "DirectlySamples",
  "CoverOf",
  "LyricalReferenceTo",
  "InterpolatesFrom"
];

// Map of influence types to colors
const influenceTypeColors = {
  "InStyleOf": "#ff33cc",
  "CoverOf": "#fc8d62",
  "DirectlySamples": "#66c2a5",
  "LyricalReferenceTo": "#984ea3",
  "InterpolatesFrom": "#e78ac3"  
};

export default function InfluenceTypeStackedHistogram({
  data,
  width = 800,
  height = 100
}) {
  const ref = useRef();

  useEffect(() => {
    if (!data) return;

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();
    // Compute dimensions of the SVG of the histogram
    const margin = { top: 40, right: 10, bottom: 20, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Get the years and influence types
    const years = Object.keys(data).map(d => +d).sort((a, b) => a - b);
    const types = allInfluenceTypes.filter(t => Object.values(data).some(d => d[t]));

    // Create a stack data structure for each year
    const stackData = years.map(year => {
      const entry = { year };
      types.forEach(type => {
        entry[type] = data[year]?.[type] || 0;
      });
      return entry;
    });

    const stack = d3.stack().keys(types);
    const series = stack(stackData);

    const y = d3.scaleBand().domain(years).range([0, innerHeight]).padding(0.2);
    const x = d3.scaleLinear()
      .domain([0, d3.max(stackData, d => d3.sum(types.map(t => d[t])))]).nice()
      .range([0, innerWidth]);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    const color = d3.scaleOrdinal()
      .domain(allInfluenceTypes)
      .range(allInfluenceTypes.map(type => influenceTypeColors[type]));

    // Labels for the legend
    const shortLabels = {
      "InStyleOf": "StyleOf",
      "CoverOf": "CoverOf",
      "DirectlySamples": "Samples",
      "LyricalReferenceTo": "LyricalRef",
      "InterpolatesFrom": "Interpolates"
    };

    // Legend layout
    const cols = 3  ;
    const legendItemSize = 8;
    const legendSpacingX = 50;
    const legendSpacingY = 10;
    const legendPadding = 5;

    const legend = svg.append("g")
      .attr("transform", `translate(${margin.left}, 10)`);

    const legendWidth = cols * legendSpacingX - (legendSpacingX - legendItemSize);
    const legendRows = Math.ceil(types.length / cols);
    const legendHeight = legendRows * legendSpacingY - (legendSpacingY - legendItemSize);

    legend.append("rect")
      .attr("width", legendWidth + legendPadding * 9)
      .attr("height", legendHeight + legendPadding * 2)
      .attr("x", -legendPadding)
      .attr("y", -legendPadding)
      .attr("fill", "white")
      .attr("stroke", "none")
      .attr("rx", 4)
      .attr("ry", 4);

    types.forEach((type, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const legendGroup = legend.append("g")
        .attr("transform", `translate(${col * legendSpacingX}, ${row * legendSpacingY})`);

      legendGroup.append("rect")
        .attr("width", legendItemSize)
        .attr("height", legendItemSize)
        .attr("fill", color(type));

      legendGroup.append("text")
        .attr("x", legendItemSize + 4)
        .attr("y", legendItemSize / 2)
        .attr("dy", "0.35em")
        .attr("font-size", 7)
        .text(shortLabels[type] || type);
    });

    // Tooltip
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "white")
      .style("border", "1px solid #ccc")
      .style("padding", "6px")
      .style("font-size", "12px")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("opacity", 0);

    // Draw bars
    g.selectAll("g.layer")
      .data(series)
      .enter()
      .append("g")
      .attr("fill", d => color(d.key))
      .selectAll("rect")
      .data(d => d)
      .enter()
      .append("rect")
      .attr("y", d => y(d.data.year))
      .attr("x", d => x(d[0]))
      .attr("width", d => x(d[1]) - x(d[0]))
      .attr("height", y.bandwidth())
      .on("mousemove", (event, d) => {
    
    // Get the counts for the tooltip
    const yearData = d.data;
    const total = Object.keys(yearData)
        .filter(k => types.includes(k))
        .reduce((sum, key) => sum + yearData[key], 0);

    const details = types
        .map(t => `${shortLabels[t] || t}: ${yearData[t] || 0}`)
        .join("<br>");

    tooltip.html(`<strong>Year:</strong> ${yearData.year}<br><strong>Total:</strong> ${total}<br>${details}`)
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 28 + "px")
        .style("opacity", 0.95);
        })
        .on("mouseout", () => {
            tooltip.style("opacity", 0);
        });

    // Y axis (show every year)
    g.append("g")
      .call(d3.axisLeft(y).tickValues(years))
      .attr("font-size", "8px");

    // X axis (counts)
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(3))
      .attr("font-size", "10px");

    // Cleanup tooltip on unmount
    return () => tooltip.remove();
  }, [data]);

  return <svg ref={ref} width={width} height={height}></svg>;
}
