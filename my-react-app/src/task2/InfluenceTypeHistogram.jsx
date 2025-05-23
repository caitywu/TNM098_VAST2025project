import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

// Function to compute the influence type counts
export function computeOceanusFolkInfluenceTypeCounts(nodes, links, selectedInfluenceTypes, yearRange) {
  const [minYear, maxYear] = yearRange;
  const nodeById = new Map(nodes.map(n => [n.id, n]));
  const result = {};

  links.forEach(link => {
    const edgeType = link.edgeType || link["Edge Type"];
    if (!selectedInfluenceTypes.has(edgeType)) return;

    const source = nodeById.get(link.source);
    const target = nodeById.get(link.target);
    if (!source || !target || target.genre !== "Oceanus Folk") return;

    const year = parseInt(target.release_date);
    if (isNaN(year) || year < minYear || year > maxYear) return;

    if (!result[year]) result[year] = {};
    if (!result[year][edgeType]) result[year][edgeType] = 0;

    result[year][edgeType] += 1;
  });

  return result;
}

const shortLabels = {
  "InStyleOf": "In Style Of",
  "CoverOf": "Cover Of",
  "DirectlySamples": "Directly Samples",
  "LyricalReferenceTo": "Lyrical Reference To",
  "InterpolatesFrom": "Interpolates From"
};

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

    const margin = { top: 40, right: 10, bottom: 20, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const years = Object.keys(data).map(d => +d).sort((a, b) => a - b);
    const types = allInfluenceTypes.filter(t => Object.values(data).some(d => d[t]));

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

    // Y axis - years
    g.append("g")
      .call(d3.axisLeft(y).tickValues(years))
      .attr("font-size", "8px");

    // X axis - counts
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(3))
      .attr("font-size", "10px");

    // Cleanup tooltip on unmount
    return () => tooltip.remove();
  }, [data, width, height]);

  // Legend styles with white background and padding
  const legendContainerStyle = {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    padding: "8px 12px",
    backgroundColor: "white",
    borderRadius: "6px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    userSelect: "none",
    marginBottom: "10px",  // space below legend before chart
  };

  const legendItemStyle = {
    display: "flex",
    alignItems: "center",
    marginRight: "5px",
    fontSize: "10px",
    cursor: "default",
  };

  const legendColorBoxStyle = {
    width: "10px",
    height: "10px",
    marginRight: "5px",
  };

  return (
    <div>
      <div style={legendContainerStyle}>
        {allInfluenceTypes.map(type => (
          <div key={type} style={legendItemStyle}>
            <div
              style={{
                ...legendColorBoxStyle,
                backgroundColor: influenceTypeColors[type],
              }}
            />
            <span>{shortLabels[type] || type}</span>
          </div>
        ))}
      </div>
      <svg ref={ref} width={width} height={height}></svg>
    </div>
  );
}