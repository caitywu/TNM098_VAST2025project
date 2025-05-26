import React, { useEffect, useState, useRef, useMemo } from "react";
import * as d3 from "d3";

function TemporalPlot() {
  const [graph, setGraph] = useState({ nodes: [], links: [] });
  const svgRef = useRef();
  const [events, setEvents] = useState([]);

  // Edge description functions
  const EDGE_DESCRIPTIONS = {
    PerformerOf: (s, t) => `${s} performed ${t}`,
    ComposerOf: (s, t) => `${s} composed ${t}`,
    ProducerOf: (s, t) => `${s} produced ${t}`,
    LyricistOf: (s, t) => `${s} wrote lyrics for ${t}`,
    RecordedBy: (s, t) => `${t} was recorded by ${s}`,
    DistributedBy: (s, t) => `${t} aided in distribution of ${s}`,
    InStyleOf: (s, t) => `${s} was performed (partly) in the style of ${t}`,
    InterpolatesFrom: (s, t) => `${s} interpolates a melody from ${t}`,
    CoverOf: (s, t) => `${s} is a cover of ${t}`,
    LyricalReferenceTo: (s, t) => `${s} makes a lyrical reference to ${t}`,
    DirectlySamples: (s, t) => `${s} directly samples ${t}`,
    MemberOf: (s, t) => `${s} was/is a member of ${t}`,
  };

  // Load graph
  useEffect(() => {
    fetch("/MC1_graph.json")
      .then((r) => r.json())
      .then((raw) => {
        const nodes = raw.nodes.map((n) => ({ ...n, id: String(n.id) }));
        const links = raw.links.map((l) => ({
          ...l,
          source: String(l.source),
          target: String(l.target),
        }));
        setGraph({ nodes, links });
      });
  }, []);

  // Memoized lookups
  const nodeById = useMemo(
    () => new Map(graph.nodes.map((n) => [n.id, n])),
    [graph.nodes]
  );
  const adjList = useMemo(() => {
    const m = new Map();
    graph.nodes.forEach((n) => m.set(n.id, []));
    graph.links.forEach((e) => {
      m.get(e.source).push({ neighbor: e.target, edgeType: e["Edge Type"] });
      m.get(e.target).push({ neighbor: e.source, edgeType: e["Edge Type"] });
    });
    return m;
  }, [graph.nodes, graph.links]);

  // Collect events per influence path
  useEffect(() => {
    if (!graph.nodes.length) return;
    const sailorNode = graph.nodes.find((n) => n.name === "Sailor Shift");
    if (!sailorNode) return;
    const sailorId = sailorNode.id;
    const visited = new Set();
    const collected = [];
    const queue = [{ id: sailorId, path: [sailorNode.name], depth: 0 }];
    const maxDepth = 3;

    while (queue.length) {
      const { id: currId, path, depth } = queue.shift();
      if (visited.has(currId)) continue;
      visited.add(currId);
      const currName = nodeById.get(currId).name;

      for (const { neighbor, edgeType } of adjList.get(currId)) {
        if (depth >= maxDepth) continue;
        const neighNode = nodeById.get(neighbor);
        if (!neighNode) continue;

        // build description for this edge
        const desc = EDGE_DESCRIPTIONS[edgeType]
          ? EDGE_DESCRIPTIONS[edgeType](currName, neighNode.name)
          : `${currName} ${edgeType} ${neighNode.name}`;
        const newPath = [...path, desc];

        // if it's a song/album with release date, record event for each contributor
        if (
          (neighNode["Node Type"].includes("Song") || neighNode["Node Type"].includes("Album")) &&
          neighNode.release_date
        ) {
          const releaseDesc = `${neighNode.name} was released in ${neighNode.release_date}`;
          const fullPath = [...newPath, releaseDesc];
          adjList.get(neighbor).forEach((e) => {
            const contributor = nodeById.get(e.neighbor);
            if (contributor["Node Type"] === "Person") {
              collected.push({
                personId: contributor.id,
                personName: contributor.name,
                release_date: +neighNode.release_date,
                fullPath,
              });
            }
          });
          queue.push({ id: neighbor, path: fullPath, depth: depth + 1 });
        } else {
          queue.push({ id: neighbor, path: newPath, depth: depth + 1 });
        }
      }
    }
    setEvents(collected);
  }, [nodeById, adjList, graph.nodes]);

  // Prepare top 10 persons and their events (exclude Sailor Shift)
  const counts = d3.rollup(
    events,
    (v) => v.length,
    (d) => d.personId
  );
  const topPersons = Array.from(counts)
    .filter(([id]) => id !== graph.nodes.find((n) => n.name === "Sailor Shift")?.id)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id);
  const topEvents = events.filter((e) => topPersons.includes(e.personId));
  const persons = topPersons.map((id) => nodeById.get(id).name);

  // Scatterplot: x=year, y=person, color per person
  useEffect(() => {
    if (!topEvents.length) return;
    const margin = { top: 40, right: 30, bottom: 40, left: 100 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
      .domain(d3.extent(topEvents, (d) => d.release_date))
      .nice()
      .range([0, width]);
    const y = d3.scalePoint()
      .domain(persons)
      .range([height, 0])
      .padding(1);
    const color = d3.scaleOrdinal(d3.schemeCategory10).domain(persons);

    // axes
    g.append("g").attr("transform", `translate(0,${height})`).call(
      d3.axisBottom(x).tickFormat(d3.format("d"))
    );
    g.append("g").call(d3.axisLeft(y));

    // points
    g.selectAll("circle")
      .data(topEvents)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.release_date))
      .attr("cy", (d) => y(d.personName))
      .attr("r", 5)
      .style("fill", (d) => color(d.personName))
      .append("title")
      .text((d) => d.fullPath.join(" → "));
  }, [topEvents, persons]);

  return (
    <div>
      <h2>Top 10 Influencers Events</h2>
      <svg ref={svgRef} width={600} height={400}></svg>
    </div>
  );
}

export default TemporalPlot;