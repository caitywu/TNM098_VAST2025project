import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

function NetworkGraph() {
  const svgRef = useRef()
  const simulationRef = useRef(null)

  const [data, setData] = useState(null)
  const [artistOptions, setArtistOptions] = useState([])
  const [selectedArtistIds, setSelectedArtistIds] = useState([])
  const [graph, setGraph] = useState({ nodes: [], links: [] })
  const [selectedNode, setSelectedNode] = useState(null)

  // 1) LOAD + NORMALIZE + SORT
  useEffect(() => {
    fetch('/MC1_graph.json')
      .then(res => res.json())
      .then(raw => {
        const nodes = raw.nodes.map(n => ({ ...n, id: String(n.id) }))
        const links = raw.links.map(l => ({
          ...l,
          source: String(l.source),
          target: String(l.target),
        }))

        const persons = nodes
          .filter(n => n["Node Type"] === "Person")
          .sort((a, b) =>
            (a.name || a.stage_name || "")
              .localeCompare(b.name || b.stage_name || "", undefined, { sensitivity: 'base' })
          )

        setData({ nodes, links })
        setArtistOptions(persons)
        if (persons.length) setSelectedArtistIds([persons[0].id])
      })
  }, [])

  // 2) BUILD 2-HOP SUBGRAPH (no longer clears selectedNode here!)
  useEffect(() => {
    if (!data || selectedArtistIds.length === 0) return

    const directLinks = data.links.filter(
      l => selectedArtistIds.includes(l.source) ||
           selectedArtistIds.includes(l.target)
    )
    const oneHop = new Set()
    directLinks.forEach(l => {
      oneHop.add(l.source)
      oneHop.add(l.target)
    })

    const secondLinks = data.links.filter(
      l => oneHop.has(l.source) || oneHop.has(l.target)
    )

    const linkMap = new Map()
    ;[...directLinks, ...secondLinks].forEach(l => {
      const key = `${l.source}--${l.target}--${l["Edge Type"]}`
      linkMap.set(key, l)
    })
    const links = Array.from(linkMap.values())

    const nodeSet = new Set()
    links.forEach(l => {
      nodeSet.add(l.source)
      nodeSet.add(l.target)
    })
    const nodes = data.nodes.filter(n => nodeSet.has(n.id))

    setGraph({ nodes, links })
    // ← removed: setSelectedNode(null)
  }, [data, selectedArtistIds])

  // 3) D3 DRAW + ZOOM + CLICK
  useEffect(() => {
    if (!graph.nodes.length || !graph.links.length) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = 1000, height = 700
    svg.attr('viewBox', [0, 0, width, height])

    const container = svg.append('g')
    const zoom = d3.zoom()
      .scaleExtent([0.1, 5])
      .on('zoom', event => {
        container.attr('transform', event.transform)
      })
    svg.call(zoom)

    simulationRef.current?.stop()

    const resolvedLinks = graph.links.map(l => ({
      ...l,
      source: graph.nodes.find(n => n.id === l.source),
      target: graph.nodes.find(n => n.id === l.target),
    }))

    const sim = d3.forceSimulation(graph.nodes)
      .force('link',
        d3.forceLink(resolvedLinks)
          .id(d => d.id)
          .distance(150)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width/2, height/2))
      .on('tick', ticked)
    simulationRef.current = sim

    const link = container.append('g')
      .attr('stroke', '#aaa')
      .selectAll('line')
      .data(resolvedLinks, d => `${d.source.id}-${d.target.id}`)
      .join('line')
      .attr('stroke-width', 1.5)

    const node = container.append('g')
      .attr('stroke', '#fff').attr('stroke-width', 1.5)
      .selectAll('circle')
      .data(graph.nodes, d => d.id)
      .join('circle')
      .attr('r', 8)
      .attr('fill', d => {
        switch (d["Node Type"]) {
          case "RecordLabel":    return '#95a5a6'   // grey
          case "Song":           return '#2ecc71'   // green
          case "Person":         return '#3498db'   // blue
          case "Album":          return '#e91e63'   // pink
          case "MusicalGroup":   return '#9b59b6'   // purple
          default:               return '#7f8c8d'   // fallback grey
        }
      })
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        setSelectedNode(d)
        if (d["Node Type"] === "Person") {
          setSelectedArtistIds([d.id])
        }
      })
      .call(drag(sim))

    const label = container.append('g')
      .selectAll('text')
      .data(graph.nodes, d => d.id)
      .join('text')
      .text(d => d.name || d.stage_name || d.id)
      .attr('font-size', 10)
      .attr('dx', 10)
      .attr('dy', 3)

    function ticked() {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)
      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
      label
        .attr('x', d => d.x)
        .attr('y', d => d.y)
    }

    function drag(sim) {
      return d3.drag()
        .on('start', e => {
          if (!e.active) sim.alphaTarget(0.3).restart()
          e.subject.fx = e.subject.x
          e.subject.fy = e.subject.y
        })
        .on('drag', e => {
          e.subject.fx = e.x
          e.subject.fy = e.y
        })
        .on('end', e => {
          if (!e.active) sim.alphaTarget(0)
          e.subject.fx = null
          e.subject.fy = null
        })
    }

    return () => sim.stop()
  }, [graph, selectedArtistIds])

  return (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <div>
        <h2>Multi-Artist Network</h2>
        <label>Select Artists:</label><br/>
        <select
          multiple
          value={selectedArtistIds}
          onChange={e => {
            const vals = Array.from(
              e.target.selectedOptions, o => o.value
            )
            setSelectedArtistIds(vals)
            setSelectedNode(null)   // still clear only on dropdown change
          }}
          style={{ width: 300, height: 200 }}
        >
          {artistOptions.map(n => (
            <option key={n.id} value={n.id}>
              {n.name || n.stage_name || n.id}
            </option>
          ))}
        </select>
      </div>

      <svg ref={svgRef} width={1000} height={700} />

      {selectedNode && (
        <div style={{ maxWidth: 300, padding: '0.5rem', border: '1px solid #ccc' }}>
          <h3>Node Info</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {Object.entries(selectedNode).map(([key, value]) => (
              <li key={key}>
                <strong>{key}:</strong> {String(value)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default NetworkGraph
