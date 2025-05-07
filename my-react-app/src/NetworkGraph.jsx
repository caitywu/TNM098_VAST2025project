import React, { useEffect, useState } from 'react'
import ArtistSelector from './ArtistSelector'
import Graph           from './Graph'
import CombinedInfo from './CombinedInfo'
import TimeSeriesChart from './TimeSeriesChart'

export default function NetworkGraph() {
  const [data, setData]               = useState(null)
  const [artists, setArtists]         = useState([])
  const [selectedArtistIds, setIds]   = useState([])
  const [graph, setGraph]             = useState({ nodes:[], links:[] })
  const [selectedNode, setSelectedNode] = useState(null)

  // load & normalize
  useEffect(() => {
    fetch('/MC1_graph.json').then(r=>r.json()).then(raw=> {
      const nodes = raw.nodes.map(n=>({...n, id:String(n.id)}))
      const links = raw.links.map(l=>({
        ...l,
        source: String(l.source),
        target: String(l.target)
      }))
      const persons = nodes
        .filter(n=>n["Node Type"]==="Person")
        .sort((a,b)=>
          (a.name||a.stage_name||"")
            .localeCompare(b.name||b.stage_name||"", undefined, {sensitivity:'base'})
        )
      setData({nodes,links})
      setArtists(persons)
      if(persons.length) setIds([persons[0].id])
    })
  },[])

  // build 2-hop
  useEffect(() => {
    if (!data||!selectedArtistIds.length) return
    const {nodes,links} = data
    const d1 = links.filter(l=>
      selectedArtistIds.includes(l.source)||
      selectedArtistIds.includes(l.target)
    )
    const hop1 = new Set(d1.flatMap(l=>[l.source,l.target]))
    const d2 = links.filter(l=>
      hop1.has(l.source)||hop1.has(l.target)
    )
    const all = [...d1,...d2]
    const uniq = Array.from(
      new Map(all.map(l=>[`${l.source}:${l.target}:${l["Edge Type"]}`,l])).values()
    )
    const nid = new Set(uniq.flatMap(l=>[l.source,l.target]))
    const subNodes = nodes.filter(n=>nid.has(n.id))
    setGraph({nodes:subNodes,links:uniq})
    // (don’t clear selectedNode here)
  }, [data, selectedArtistIds])

  const handleNodeClick = node => {
    setSelectedNode(node)
    if (node["Node Type"] === "Person") {
      setIds([node.id])
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#7f7a78' /* your grey background */
    }}>
      {/* ─── TOP ROW: selector, network, toolbar ─── */}
      <div style={{
        display: 'flex',
        flex: 1,
        borderBottom: '2px solid #fff'
      }}>
        <div style={{ width: 300, padding: '1rem' }}>
          <ArtistSelector
            options={artists}
            selectedIds={selectedArtistIds}
            onChange={ids => {
              setIds(ids)
              setSelectedNode(null)
            }}
          />
        </div>

        <div style={{ flex: 1, position: 'relative' }}>
          <Graph
            graph={graph}
            selectedArtistIds={selectedArtistIds}
            onNodeClick={handleNodeClick}
          />
        </div>

        <div style={{
          width: 200,
          background: '#888',
          color: '#fff',
          writingMode: 'vertical-rl',
          textAlign: 'center',
          lineHeight: '200px'
        }}>
          TOOLBAR
        </div>
      </div>

      {/* ─── BOTTOM ROW: detail view 1 & 2 ─── */}
      <div style={{ display: 'flex', height: 250 }}>
        <div style={{
          flex: 1,
          borderRight: '2px solid #fff',
          overflow: 'auto',
          padding: '0.5rem'
        }}>
          <TimeSeriesChart nodes={data?.nodes || []} />
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '0.5rem' }}>
          <CombinedInfo
            data={data}
            selectedNode={selectedNode}
            onNodeClick={handleNodeClick}
            nodes={data?.nodes || []}

          />
        </div>
      </div>
    </div>
  )
}