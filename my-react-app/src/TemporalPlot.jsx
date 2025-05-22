import React, { useRef, useEffect, useMemo } from "react";
import * as d3 from "d3";

export default function TemporalPlot() {
  //   const svgRef = useRef();
  //   const width = 800;
  //   const height = 250;

  var margin = { top: 10, right: 30, bottom: 30, left: 60 },
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

  // append the svg object to the body of the page
  var svg = d3
    .select("#my_dataviz")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  return <svg ref={svg} style={{ width: "100%", height: height }} />;
}
