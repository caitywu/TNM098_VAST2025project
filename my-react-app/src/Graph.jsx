import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'

export default function Graph({
  graph,
  selectedArtistIds,
  onNodeClick
}) {
  const svgRef = useRef()
  const simRef = useRef()

  useEffect(() => {
    if (!graph.nodes.length) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = 800, height = 600
    svg.attr('viewBox', [0, 0, width, height])

    const container = svg.append('g')
    svg.call(d3.zoom()
      .scaleExtent([0.1,5])
      .on('zoom', e => container.attr('transform', e.transform))
    )

    simRef.current?.stop()

    // resolve links
    const links = graph.links.map(l => ({
      ...l,
      source: graph.nodes.find(n => n.id === l.source),
      target: graph.nodes.find(n => n.id === l.target)
    }))

    const sim = d3.forceSimulation(graph.nodes)
      .force('link', d3.forceLink(links)
        .id(d => d.id)
        .distance(150)
      )
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width/2, height/2))
      .on('tick', ticked)

    simRef.current = sim

    // links
    container.append('g')
      .attr('stroke','#aaa')
      .selectAll('line')
      .data(links, d => `${d.source.id}:${d.target.id}`)
      .join('line')
      .attr('stroke-width',1.2)

    // nodes
    const nodeSel = container.append('g')
      .attr('stroke','#fff')
      .attr('stroke-width',1.2)
      .selectAll('circle')
      .data(graph.nodes, d => d.id)
      .join('circle')
      .attr('r', 6)
      .attr('fill', d => {
        switch (d["Node Type"]) {
          case "RecordLabel":  return '#95a5a6'
          case "Song":         return '#2ecc71'
          case "Person":       return '#3498db'
          case "Album":        return '#e91e63'
          case "MusicalGroup": return '#9b59b6'
          default:             return '#7f8c8d'
        }
      })
      .style('cursor','pointer')
      .on('click', (e,d) => onNodeClick(d))
      .call(d3.drag()
        .on('start', evt => {
          if (!evt.active) sim.alphaTarget(0.3).restart()
          evt.subject.fx = evt.subject.x
          evt.subject.fy = evt.subject.y
        })
        .on('drag', evt => {
          evt.subject.fx = evt.x
          evt.subject.fy = evt.y
        })
        .on('end', evt => {
          if (!evt.active) sim.alphaTarget(0)
          evt.subject.fx = null
          evt.subject.fy = null
        })
      )

    // labels
    container.append('g')
      .selectAll('text')
      .data(graph.nodes, d => d.id)
      .join('text')
      .text(d => d.name || d.stage_name || d.id)
      .attr('font-size', 9)
      .attr('dx', 8)
      .attr('dy', 3)

    function ticked() {
      container.selectAll('line')
        .attr('x1', d=>d.source.x)
        .attr('y1', d=>d.source.y)
        .attr('x2', d=>d.target.x)
        .attr('y2', d=>d.target.y)
      nodeSel
        .attr('cx', d=>d.x)
        .attr('cy', d=>d.y)
      container.selectAll('text')
        .attr('x', d=>d.x)
        .attr('y', d=>d.y)
    }

    return () => sim.stop()
  }, [graph, selectedArtistIds, onNodeClick])

  return <svg ref={svgRef} width="800" height="600" />
}
