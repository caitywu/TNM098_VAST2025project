import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

function genreColor(genre) {
  if (genre === "Oceanus Folk") return "red";
  if (genre.toLowerCase().endsWith("rock")) return "#1f77b4";
  if (genre.toLowerCase().endsWith("folk")) return "#2ca02c";
  if (genre.toLowerCase().endsWith("metal")) return "#9467bd";
  if (genre.toLowerCase().endsWith("pop")) return "#ff7f0e";
  return "#000000";
}

export default function StackedHistogram({ data, width = 800, height = 100 }) {
  const ref = useRef();

  useEffect(() => {
    if (!data) return;

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const margin = { top: 10, right: 20, bottom: 20, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const years = Object.keys(data).map(d => +d).sort((a, b) => a - b);
    const genres = Array.from(new Set(Object.values(data).flatMap(yearData => Object.keys(yearData))));

    const stackData = years.map(year => {
      const yearData = data[year];
      const entry = { year };
      genres.forEach(genre => {
        const values = yearData?.[genre] || {};
        entry[genre] = Object.values(values).reduce((sum, v) => sum + v, 0);
      });
      return entry;
    });

    const stack = d3.stack().keys(genres);
    const series = stack(stackData);

    const x = d3.scaleBand().domain(years).range([0, innerWidth]).padding(0.1);
    const y = d3.scaleLinear()
      .domain([0, d3.max(stackData, d => d3.sum(genres.map(g => d[g] || 0)))])
      .nice()
      .range([innerHeight - 18, 0]);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    g.selectAll("g.layer")
      .data(series)
      .enter()
      .append("g")
      .attr("fill", d => genreColor(d.key))
      .selectAll("rect")
      .data(d => d)
      .enter()
      .append("rect")
      .attr("x", d => x(d.data.year))
      .attr("y", d => y(d[1]))
      .attr("height", d => y(d[0]) - y(d[1]))
      .attr("width", x.bandwidth());

    g.append("g")
      .call(d3.axisLeft(y).ticks(3))
      .attr("font-size", "10px");

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).tickValues(years.filter((_, i) => i % 5 === 0)))
      .attr("font-size", "10px");
  }, [data]);

  return <svg ref={ref} width={width} height={height}></svg>;
}
