import React, { useEffect, useState, useRef } from "react";
import * as d3 from "d3";
import NetworkGraph from "./NetworkGraph";

function TemporalPlot() {
  const [graph, setGraph] = useState({ nodes: [], links: [] });
  const svgRef = useRef();
  const [nodesNetwork, setNetwork] = useState([]);
  const [data, setData] = useState(null);

  // the five “influence” edge‐types
const INFL = new Set([
  "InStyleOf",
  "InterpolatesFrom",
  "CoverOf",
  "LyricalReferenceTo",
  "DirectlySamples",
]);

const CONT = new Set([
  "PerformerOf",
  "ComposerOf",
  "ProducerOf",
  "LyricistOf"
]);


  useEffect(() => {
    fetch('/MC1_graph.json')
      .then(response => response.json())
      .then(raw => {
        const nodes = raw.nodes.map((n) => ({ ...n, id: String(n.id) })) || [];
        const links = raw.links.map((l) => ({
          ...l,
          source: String(l.source),
          target: String(l.target),
        }));
        setData({ nodes, links });
        //console.log("data", data);

      })
      .catch(error => console.error("Fel vid laddning:", error));
  }, []);


  // filter to get all the wanted nodes and edges
  useEffect(() => {
    const sailor = graph.nodes.filter(n => n.id === 17255); // Sailor Shift

    setNetwork(sailor);
    //console.log("sailor", sailor);

    const connectedEdges = graph.links.filter(e => INFL.has(e["Edge Type"]) &&
    (e.source === sailor.id || e.target === sailor.id));
   
    //console.log("connectedEdges", connectedEdges);


    const connectedNodeIds = new Set(
    connectedEdges.map(e =>
    e.source === sailor.id ? e.target : e.source));

    //console.log("connectednodeids", connectedNodeIds);


    const res = [];

    connectedNodeIds.forEach(songAlbum => {

      const relatedE = graph.links.filter(e => 
        (e.source === songAlbum.id || e.target === songAlbum.id) && CONT.has(e["Edge Type"]));
      
        relatedE.forEach(edge => {
          const personId =
          edge.source === songAlbum.id ? edge.target : edge.source;

          const personNode = graph.nodes.find(n => 
            n.id === personId && n["Node Type"] === "Person"
          );

          if (personNode && songAlbum.release_Date) {
            res.push({
              id:personNode.id,
              name: personNode.name,
              release_date: +songAlbum.release_date,
              edgeType: edge["Edge Type"]
            });
          }
        })
      })

      setNetwork(res);

    //console.log("network", nodesNetwork); //TOM åtgärda!

    //setNetwork(graph.nodes.filter(n => connectedNodeIds.has(n.id)));
  }, []);
 

  useEffect(() => {
  if (nodesNetwork) {
    console.log("sialor:", nodesNetwork);
  }
}, [nodesNetwork]);

  // draw the network
  useEffect(() => {
    if (!nodesNetwork || nodesNetwork.length === 0) return;

    const margin = { top: 10, right: 30, bottom: 30, left: 60 };
    const width = 460 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    const releaseDates = 
      nodesNetwork.map(n => +n.release_date)  // + konverterar till tal
      .filter(d => !isNaN(d));    // rensa bort ogiltiga datum

    const minDate = d3.min(releaseDates);
    const maxDate = d3.max(releaseDates);

    //clean
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([minDate, maxDate]).range([0, width]);
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    const y = d3.scaleLinear().domain([0, 10]).range([height, 0]);
    svg.append("g").call(d3.axisLeft(y));

    // svg.append("g")
    //   .selectAll("circle")
    //   .data(nodesNetwork.filter(d => d["Node Type"] === "Person" && d.release_date))
    //   .enter()
    //   .append("circle")
    //   .attr("cx", d => x(+d.release_date))
    //   .attr("cy", d => y(3))
    //   .attr("r", 3)
    //   .style("fill", "#69b3a2");

    svg.append("g")
  .selectAll("circle")
  .data(nodesNetwork)
  .enter()
  .append("circle")
  .attr("cx", d => x(d.release_date))
  .attr("cy", d => y(1)) // ev. räkna frekvens om du vill fördela
  .attr("r", 3)
  .style("fill", "#1f77b4");

  svg.selectAll("text")
  .data(nodesNetwork)
  .enter()
  .append("text")
  .attr("x", d => x(d.release_date) + 4)
  .attr("y", d => y(1))
  .text(d => d.name)
  .style("font-size", "10px");

  //console.log("network", nodesNetwork);





  }, []);

  return (
    <svg ref={svgRef} width={600} height={400}></svg>
  );
}

export default TemporalPlot;
