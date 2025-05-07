// src/TimeSeriesChart.jsx
import React, { useRef, useEffect } from 'react'
import * as d3 from 'd3'

export default function TimeSeriesChart({ nodes }) {
  const svgRef = useRef()

  useEffect(() => {
    if (!nodes || !nodes.length) return

    // 1) Filter only songs, parse years
    const songs = nodes
      .filter(n => n["Node Type"] === "Song" && n.release_date)
      .map(n => ({
        year: +n.release_date,
        isOceanus: n.genre === "Oceanus Folk"
      }))

    if (!songs.length) return

    // 2) Determine year range
    const years = Array.from(new Set(songs.map(s => s.year))).sort((a,b)=>a-b)
    const minY = d3.min(years)
    const maxY = d3.max(years)

    // 3) Initialize counts per year
    const data = d3.range(minY, maxY + 1).map(y => ({
      year: y,
      oceanus: 0,
      others: 0
    }))

    // 4) Fill counts
    songs.forEach(({ year, isOceanus }) => {
      const d = data[year - minY]
      if (isOceanus) d.oceanus += 1
      else          d.others  += 1
    })

    // 5) Set up svg
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    const margin = { top: 20, right: 20, bottom: 30, left: 40 }
    const width  = 600 - margin.left - margin.right
    const height = 200 - margin.top - margin.bottom

    const g = svg
      .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)

    // 6) Scales
    const x = d3.scaleLinear()
      .domain([minY, maxY])
      .range([0, width])

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => Math.max(d.oceanus, d.others))])
      .nice()
      .range([height, 0])

    // 7) Axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")))

    g.append('g')
      .call(d3.axisLeft(y))

    // 8) Line generators
    const lineOceanus = d3.line()
      .x(d => x(d.year))
      .y(d => y(d.oceanus))

    const lineOthers = d3.line()
      .x(d => x(d.year))
      .y(d => y(d.others))

    // 9) Draw lines
    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#2ecc71')
      .attr('stroke-width', 2)
      .attr('d', lineOceanus)

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#e74c3c')
      .attr('stroke-width', 2)
      .attr('d', lineOthers)

    // 10) Legend
    const legend = g.append('g')
      .attr('transform', `translate(${width - 120},0)`)

    legend.append('rect')
      .attr('width', 120)
      .attr('height', 40)
      .attr('fill', 'white')
      .attr('opacity', 0.8)

    legend.append('circle').attr('cx', 10).attr('cy', 10).attr('r', 5).attr('fill', '#2ecc71')
    legend.append('text').attr('x', 20).attr('y', 14).text('Oceanus Folk').attr('font-size', 10)

    legend.append('circle').attr('cx', 10).attr('cy', 25).attr('r', 5).attr('fill', '#e74c3c')
    legend.append('text').attr('x', 20).attr('y', 29).text('Others').attr('font-size', 10)

  }, [nodes])

  return (
    <div style={{ marginTop: '1rem' }}>
      <h4>Genre Over Time</h4>
      <svg ref={svgRef} width={600} height={200} />
    </div>
  )
}
