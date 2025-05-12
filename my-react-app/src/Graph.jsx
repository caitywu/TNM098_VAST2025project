// src/Graph.jsx
import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'

export default function Graph({
  graph,
  visibleEdgeTypes,
  selectedNodeId,
  onNodeClick
}) {
  const svgRef     = useRef()
  const simRef     = useRef()
  const zoomRef = useRef()
  const tooltipRef = useRef()

  useEffect(() => {
    zoomRef.current = d3.zoom()
      .scaleExtent([0.1, 5])
      .on('zoom', e => {
        // apply transform to the inner <g>
        d3.select(svgRef.current).select('g')
          .attr('transform', e.transform)
      })
  }, [])

  const width  = 800
  const height = 600

  // Create the tooltip div once
  useEffect(() => {
    if (!tooltipRef.current) {
      tooltipRef.current = d3.select('body')
        .append('div')
        .attr('class','edge-tooltip')
        .style('position','absolute')
        .style('padding','4px 8px')
        .style('background','rgba(0,0,0,0.7)')
        .style('color','#fff')
        .style('border-radius','4px')
        .style('pointer-events','none')
        .style('visibility','hidden')
    }
  }, [])
  

  useEffect(() => {
    if (!graph.nodes.length) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    svg.attr('viewBox', `0 0 ${width} ${height}`)

    // Container for zoom/pan
    const container = svg.append('g')
    svg.call(zoomRef.current)

    // re‐apply the last known zoom transform
    const last = d3.zoomTransform(svgRef.current)
    svg.call(zoomRef.current.transform, last)

    // 1) Filter edges by type
    const filtered = graph.links.filter(l =>
      visibleEdgeTypes.has(l['Edge Type'])
    )

    // 2) Prepare gradient definitions
    const defs = svg.append('defs')
    filtered.forEach(l => {
      const gradId = `grad-${l.source}-${l.target}-${l['Edge Type']}`
      const lg = defs.append('linearGradient')
        .attr('id', gradId)
        .attr('gradientUnits','userSpaceOnUse')
      lg.append('stop').attr('offset','0%').attr('stop-color','blue')
      lg.append('stop').attr('offset','50%').attr('stop-color','white')
      lg.append('stop').attr('offset','100%').attr('stop-color','red')
    })

    // 3) Resolve filtered edges to objects
    const linkData = filtered.map(l => ({
      ...l,
      source: graph.nodes.find(n => n.id === l.source),
      target: graph.nodes.find(n => n.id === l.target)
    }))

    // 4) Group parallel edges
    const edgeGroups = d3.group(
      linkData,
      d => [d.source.id,d.target.id].sort().join('__')
    )

    // 5) Build the force simulation
    simRef.current?.stop()
    function forceFocus(alpha) {
     if (!selectedNodeId) return
     const n = graph.nodes.find(d => d.id === selectedNodeId)
     if (n) {
      // strength controls how "hard" it pulls
       const strength = 0.01 * alpha
       n.vx += (width/2 - n.x) * strength
       n.vy += (height/2 - n.y) * strength
     }
   }

   const sim = d3.forceSimulation(graph.nodes)
     .force('link', d3.forceLink(linkData)
       .id(d => d.id)
       .distance(120)
     )
     .force('charge', d3.forceManyBody().strength(-200))
     // optional: you can keep center to gently keep others in view
     .force('center', d3.forceCenter(width/2, height/2))
     // our custom focus force
     .force('focus', forceFocus)
     .on('tick', ticked)


    simRef.current = sim

    // 6) Draw curved, gradient edges
    const edges = container.append('g')
      .selectAll('path')
      .data(linkData, (d,i) =>
        `${d.source.id}-${d.target.id}-${d['Edge Type']}-${i}`
      )
      .join('path')
        .attr('fill','none')
        .attr('stroke-width', 2)
        .attr('stroke', d =>
          `url(#grad-${d.source.id}-${d.target.id}-${d['Edge Type']})`
        )
        .style('opacity', 0.7)
        .on('mouseover', (e,d) => {
          tooltipRef.current
            .style('visibility','visible')
            .text(d['Edge Type'])
        })
        .on('mousemove', e => {
          tooltipRef.current
            .style('top',  `${e.pageY+8}px`)
            .style('left', `${e.pageX+8}px`)
        })
        .on('mouseout', () => {
          tooltipRef.current.style('visibility','hidden')
        })

    // 7) Symbol mapping for node types
    const shapeMap = {
      Person:       d3.symbolCircle,
      Song:         d3.symbolTriangle,
      Album:        d3.symbolSquare,
      MusicalGroup: d3.symbolStar,
      RecordLabel:  d3.symbolDiamond
    }

    // 8) Symbol generator with dynamic size
    const symGen = d3.symbol()
      .type(d => shapeMap[d['Node Type']] || d3.symbolCircle)
      .size(d => d.id === selectedNodeId ? 600 : 200)

    // 9) Draw nodes as <path> symbols
    const nodes = container.append('g')
      .selectAll('path.node')
      .data(graph.nodes, d => d.id)
      .join('path')
        .attr('class','node')
        .attr('d', symGen)
        .attr('fill', d => {
          switch (d['Node Type']) {
            case 'RecordLabel':  return '#ffffcc'
            case 'Song':         return '#c2e699'
            case 'Person':       return '#006837'
            case 'Album':        return '#31a354'
            case 'MusicalGroup': return '#78c679'
            default:             return '#A9A9A9'
          }
        })
        .attr('stroke','black')
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

    // 10) Draw labels
    const labels = container.append('g')
      .selectAll('text')
      .data(graph.nodes, d => d.id)
      .join('text')
        .text(d => d.name || d.stage_name || d.id)
        .attr('font-size', 8)
        .attr('dx', 6)
        .attr('dy', 2)
        .attr('font-size', d => d.id === selectedNodeId ? 12 : 8)
.attr('font-weight', d => d.id === selectedNodeId ? 'bold' : 'normal')


    // 11) Tick handler
    function ticked() {
      // reposition edges with slight curves for parallels
      edges.attr('d', d => {
        const key = [d.source.id,d.target.id].sort().join('__')
        const grp = edgeGroups.get(key)
        const idx = grp.indexOf(d)
        const n   = grp.length
        const curve = (idx - (n-1)/2) * 6

        const {x:x1,y:y1} = d.source
        const {x:x2,y:y2} = d.target
        const mx = (x1+x2)/2, my = (y1+y2)/2
        const dx = y2-y1, dy = x1-x2
        const len = Math.hypot(dx,dy)||1
        const ux = dx/len, uy = dy/len
        const cx = mx + ux*curve, cy = my + uy*curve

        return `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`
      })

      // update gradient endpoints so color tracks direction
      linkData.forEach(d => {
        svg.select(`#grad-${d.source.id}-${d.target.id}-${d['Edge Type']}`)
          .attr('x1', d.source.x)
          .attr('y1', d.source.y)
          .attr('x2', d.target.x)
          .attr('y2', d.target.y)
      })

      // reposition nodes & labels
      nodes.attr('transform', d => `translate(${d.x},${d.y})`)
      labels.attr('x', d => d.x).attr('y', d => d.y)
    }

    return () => sim.stop()
  }, [graph, visibleEdgeTypes, selectedNodeId, onNodeClick])

  // 3) Recenter effect: runs when selectedNodeId changes
  useEffect(() => {
    if (!selectedNodeId) return
    // find the node
    const node = graph.nodes.find(n => n.id === selectedNodeId)
    if (!node) return

    // grab the raw SVG element and its current zoom‐transform
  const svgEl = svgRef.current
  const cur   = d3.zoomTransform(svgEl)   // { x, y, k: scale }

  // compute new translate so that node.x,node.y goes to the center
  const x = (width  / 2) - node.x * cur.k
  const y = (height / 2) - node.y * cur.k

  // apply it with a smooth transition, preserving cur.k
  d3.select(svgEl)
    .transition().duration(750)
    .call(
      zoomRef.current.transform,
      d3.zoomIdentity.translate(x, y).scale(cur.k)
    )
  }, [selectedNodeId, graph.nodes, visibleEdgeTypes])



   return (
   <svg
     ref={svgRef}
     style={{ width: '100%', height: '100%', display: 'block' }}
     viewBox={`0 0 ${width} ${height}`}
     preserveAspectRatio="xMidYMid meet"
   />
)
}
