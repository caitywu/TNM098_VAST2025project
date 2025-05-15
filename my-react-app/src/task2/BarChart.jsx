import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export default function OceanusFolkInfluenceBarChart({ data }) {
  const ref = useRef();

  useEffect(() => {
    if (!data) return;

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const width = 180;
    const height = 130;
    const margin = { top: 10, right: 10, bottom: 40, left: 40 };

    // Shortened display names
    const labelMap = {
      DirectlySamples: "Samples",
      CoverOf: "Covers",
      StyleOf: "InStyleOf",
      LyricalReferenceTo: "LyricalRefTo",
    };

    const barData = Object.entries(data).map(([type, count]) => ({
      type,
      count,
      displayName: labelMap[type] || type,
    }));

    const x = d3.scaleBand()
      .domain(barData.map(d => d.displayName))
      .range([margin.left, width - margin.right])
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([0, d3.max(barData, d => d.count)])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const g = svg
      .attr("width", width)
      .attr("height", height)
      .append("g");

    g.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickSizeOuter(0))
      .selectAll("text")
      .attr("transform", "rotate(-30)")
      .style("text-anchor", "end")
      .style("font-size", "8px");

    g.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(4))
      .selectAll("text")
      .style("font-size", "8px");

    g.selectAll("rect")
      .data(barData)
      .enter()
      .append("rect")
      .attr("x", d => x(d.displayName))
      .attr("y", d => y(d.count))
      .attr("width", x.bandwidth())
      .attr("height", d => y(0) - y(d.count))
      .attr("fill", "#444");
  }, [data]);

  return <svg ref={ref}></svg>;
}
