import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

function NetworkGraph() {
  const svgRef = useRef()
  const simulationRef = useRef(null)

  const [data, setData] = useState(null)
  const [artistOptions, setArtistOptions] = useState([])
  const [selectedArtistIds, setSelectedArtistIds] = useState([])
  const [graph, setGraph] = useState({ nodes: [], links: [] })

  // 1) LOAD + NORMALIZE
  useEffect(() => {
    fetch('/MC1_graph.json')
      .then(res => res.json())
      .then(raw => {
        // Convert every node.id, link.source, link.target to string
        const nodes = raw.nodes.map(n => ({ ...n, id: String(n.id) }))
        const links = raw.links.map(l => ({
          ...l,
          source: String(l.source),
          target: String(l.target),
        }))

        setData({ nodes, links })

        // build person list
        const persons = nodes.filter(n => n["Node Type"] === "Person")
        setArtistOptions(persons)

        // auto-select first person
        if (persons.length) {
          setSelectedArtistIds([ persons[0].id ])
        }
      })
  }, [])

  // 2) BUILD SUBGRAPH whenever selection changes
  useEffect(() => {
    if (!data || selectedArtistIds.length === 0) {
      console.log("no data or no selection")
      return
    }

    console.log("BUILD for:", selectedArtistIds)

    // keep any link where source or target is in selectedArtistIds
    const links = data.links.filter(
      l => selectedArtistIds.includes(l.source)
        || selectedArtistIds.includes(l.target)
    )

    // collect node IDs
    const nodeSet = new Set()
    links.forEach(l => {
      nodeSet.add(l.source)
      nodeSet.add(l.target)
    })

    const nodes = data.nodes.filter(n => nodeSet.has(n.id))

    console.log(" → nodes:", nodes.length, "links:", links.length)
    setGraph({ nodes, links })
  }, [data, selectedArtistIds])

  // 3) D3 DRAW + RESTART on every graph change
  useEffect(() => {
    if (!graph.nodes.length || !graph.links.length) return

    // clear
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = 1000, height = 700
    svg.attr('viewBox', [0,0,width,height])

    // stop old sim
    if (simulationRef.current) simulationRef.current.stop()

    // resolve links → node objects
    const resolvedLinks = graph.links.map(l => ({
      ...l,
      source: graph.nodes.find(n => n.id === l.source),
      target: graph.nodes.find(n => n.id === l.target),
    }))

    // new simulation
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

    const link = svg.append('g')
      .attr('stroke','#aaa')
      .selectAll('line')
      .data(resolvedLinks, d => `${d.source.id}-${d.target.id}`)
      .join('line')
      .attr('stroke-width',1.5)

    const node = svg.append('g')
      .attr('stroke','#fff').attr('stroke-width',1.5)
      .selectAll('circle')
      .data(graph.nodes, d => d.id)
      .join('circle')
      .attr('r',8)
      .attr('fill', d =>
        selectedArtistIds.includes(d.id) ? '#e74c3c' : '#3498db'
      )
      .call(drag(sim))

    const label = svg.append('g')
      .selectAll('text')
      .data(graph.nodes, d => d.id)
      .join('text')
      .text(d => d.name || d.stage_name || d.id)
      .attr('font-size',10)
      .attr('dx',10)
      .attr('dy',3)

    function ticked() {
      link
        .attr('x1', d=>d.source.x)
        .attr('y1', d=>d.source.y)
        .attr('x2', d=>d.target.x)
        .attr('y2', d=>d.target.y)

      node
        .attr('cx', d=>d.x)
        .attr('cy', d=>d.y)

      label
        .attr('x', d=>d.x)
        .attr('y', d=>d.y)
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
        }}
        style={{ width:300, height:200 }}
      >
        {artistOptions.map(n => (
          <option key={n.id} value={n.id}>
            {n.name || n.stage_name || n.id}
          </option>
        ))}
      </select>

      <svg ref={svgRef} width={1000} height={700}/>
    </div>
  )
}

export default NetworkGraph
