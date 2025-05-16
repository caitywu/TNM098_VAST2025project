// src/TemporalInfluenceChart.jsx
import React, { useRef, useEffect, useMemo } from 'react'
import * as d3 from 'd3'

export default function TemporalInfluenceChart({ graph, selectedNodeId }) {
  const svgRef = useRef()
  const width  = 800
  const height = 250

  // 1) Compute rows, allYears & topSeries only when inputs change
  const { rows, allYears, topSeries } = useMemo(() => {
    const INFL = new Set([
      'InStyleOf','InterpolatesFrom',
      'CoverOf','LyricalReferenceTo','DirectlySamples'
    ])
    if (!graph || !selectedNodeId) {
      return { rows: [], allYears: [], topSeries: [] }
    }

    // gather only influence edges
    const raw = graph.links
      .filter(l => l.source === selectedNodeId && INFL.has(l['Edge Type']))
      .map(l => {
        const n = graph.nodes.find(n => n.id === l.source)
        return n ? { year: +n.release_date, name: n.name } : null
      })
    const filteredRows = raw.filter(Boolean)
    const years = Array.from(new Set(filteredRows.map(r => r.year)))
      .sort(d3.ascending)

    // nest by influencer → year → count
    const byInf = d3.rollup(
      filteredRows,
      v => v.length,
      d => d.name,
      d => d.year
    )

    // pivot into series
    let series = Array.from(byInf, ([name, m]) => ({
      name,
      values: years.map(y => ({ year: y, count: m.get(y) || 0 }))
    }))

    // pick top 5 by total count
    series = series
      .sort((a,b) =>
        d3.sum(b.values, d=>d.count)
        - d3.sum(a.values, d=>d.count)
      )
      .slice(0,5)

    return {
      rows: filteredRows,
      allYears: years,
      topSeries: series
    }
  }, [graph?.links, graph?.nodes, selectedNodeId])

  // 2) Draw or early‐exit
  useEffect(() => {
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    // No data case
    if (rows.length === 0) {
      svg
        .append('text')
        .attr('x', width/2)
        .attr('y', height/2)
        .attr('text-anchor','middle')
        .style('font-size','14px')
        .text('No influence data for this artist')
      return
    }

    // margins
    const margin = { top: 20, right: 80, bottom: 30, left: 40 }
    const w = width  - margin.left - margin.right
    const h = height - margin.top  - margin.bottom

    // container
    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)

    // scales
    const x = d3.scaleLinear()
      .domain(d3.extent(allYears))
      .range([0, w])

    const y = d3.scaleLinear()
      .domain([0, d3.max(topSeries, s=>d3.max(s.values, d=>d.count))])
      .nice()
      .range([h, 0])

    const color = d3.scaleOrdinal(d3.schemeCategory10)
      .domain(topSeries.map(s=>s.name))

    // axes
    g.append('g')
      .attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).tickFormat(d3.format('d')))

    g.append('g')
      .call(d3.axisLeft(y))

    // line generator
    const line = d3.line()
      .x(d => x(d.year))
      .y(d => y(d.count))
      .curve(d3.curveMonotoneX)

    // draw each series
    const seriesG = g.selectAll('.series')
      .data(topSeries, d=>d.name)
      .join('g')
        .attr('class','series')

    seriesG.append('path')
      .attr('fill','none')
      .attr('stroke', d=>color(d.name))
      .attr('stroke-width', 1.5)
      .attr('d', d=>line(d.values))

    // label at end of each line
    seriesG.append('text')
      .datum(d => ({
        name: d.name,
        value: d.values[d.values.length - 1]
      }))
      .attr('x', d => x(d.value.year) + 5)
      .attr('y', d => y(d.value.count))
      .text(d => d.name)
      .style('font-size','10px')

  }, [rows, allYears, topSeries])

  return (
    <svg
      ref={svgRef}
      style={{ width: '100%', height: height }}
    />
  )
}
