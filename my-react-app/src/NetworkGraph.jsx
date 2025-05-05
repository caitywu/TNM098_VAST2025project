import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

const TARGET_NAME = "Sailor Shift" // Change this to any artist name

function NetworkGraph() {
  const svgRef = useRef()
  const [graph, setGraph] = useState({ nodes: [], links: [] })

  useEffect(() => {
    fetch('/MC1_graph.json')
      .then(res => res.json())
      .then(data => {
        const centerNode = data.nodes.find(n => n.name === TARGET_NAME || n.stage_name === TARGET_NAME)

        if (!centerNode) {
          console.error("Target not found")
          return
        }

        // Get direct edges and connected nodes
        const connectedLinks = data.links.filter(l => l.source === centerNode.id || l.target === centerNode.id)
        const connectedNodeIds = new Set([centerNode.id])

        connectedLinks.forEach(link => {
          connectedNodeIds.add(link.source)
          connectedNodeIds.add(link.target)
        })

        const filteredNodes = data.nodes.filter(n => connectedNodeIds.has(n.id))
        setGraph({ nodes: filteredNodes, links: connectedLinks })
      })
  }, [])

  useEffect(() => {
    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const width = 600, height = 600
    svg.attr("viewBox", [0, 0, width, height])

    const simulation = d3.forceSimulation(graph.nodes)
      .force("link", d3.forceLink(graph.links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .on("tick", ticked)

    const link = svg.append("g")
      .selectAll("line")
      .data(graph.links)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 1.5)

    const node = svg.append("g")
      .selectAll("circle")
      .data(graph.nodes)
      .join("circle")
      .attr("r", 6)
      .attr("fill", d => d.name === TARGET_NAME || d.stage_name === TARGET_NAME ? "#e74c3c" : "#3498db")
      .call(drag(simulation))

    const label = svg.append("g")
      .selectAll("text")
      .data(graph.nodes)
      .join("text")
      .text(d => d.name || d.stage_name || d.id)
      .attr("font-size", 10)
      .attr("dx", 8)
      .attr("dy", "0.35em")

    function ticked() {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y)

      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)

      label
        .attr("x", d => d.x)
        .attr("y", d => d.y)
    }

    function drag(simulation) {
      return d3.drag()
        .on("start", event => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          event.subject.fx = event.subject.x
          event.subject.fy = event.subject.y
        })
        .on("drag", event => {
          event.subject.fx = event.x
          event.subject.fy = event.y
        })
        .on("end", event => {
          if (!event.active) simulation.alphaTarget(0)
          event.subject.fx = null
          event.subject.fy = null
        })
    }

    return () => simulation.stop()
  }, [graph])

  return (
    <div>
      <h2>Network: {TARGET_NAME}</h2>
      <svg ref={svgRef} width={600} height={600}></svg>
    </div>
  )
}

export default NetworkGraph
