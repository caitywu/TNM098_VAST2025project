// src/CombinedPanel.jsx
import React from 'react'

export default function CombinedPanel({
  data,
  selectedNode,
  onNodeClick    // new prop
}) {
  if (!data || !selectedNode) return null

  const { nodes, links } = data
  const id = selectedNode.id

  // 1-hop edges from this node
  const outgoing = links.filter(l => l.source === id)

  // Albums they performed on
  const albums = outgoing
    .filter(l =>
      l["Edge Type"] === "PerformerOf" &&
      nodes.find(n => n.id === l.target)["Node Type"] === "Album"
    )
    .map(l => nodes.find(n => n.id === l.target))

  // Songs they performed on
  const songs = outgoing
    .filter(l =>
      l["Edge Type"] === "PerformerOf" &&
      nodes.find(n => n.id === l.target)["Node Type"] === "Song"
    )
    .map(l => nodes.find(n => n.id === l.target))

  // Groups they’re member of
  const groups = outgoing
    .filter(l => l["Edge Type"] === "MemberOf")
    .map(l => nodes.find(n => n.id === l.target))

  const title = selectedNode.name
    || selectedNode.stage_name
    || selectedNode.id

  return (
    <div style={{
      marginTop: '1rem',
      padding: '1rem',
      background: '#222',
      color: '#fff',
      borderRadius: 4,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Basic Info */}
      <h3 style={{ margin: 0 }}>{title}</h3>
      <p><strong>Type:</strong> {selectedNode["Node Type"]}</p>
      <p>Released: {selectedNode["release_date"]}</p>
      {selectedNode.stage_name && (
        <p><strong>Stage Name:</strong> {selectedNode.stage_name}</p>
      )}
      {selectedNode.genre && (
        <p><strong>Genre:</strong> {selectedNode.genre}</p>
      )}
      <p><strong>ID:</strong> {selectedNode.id}</p>

      {/* Albums (dropdown → onChange) */}
      {albums.length > 0 && (
        <div>
          <label style={{ color: '#ccc' }}><strong>Albums:</strong></label>
          <select
            onChange={e => {
              const node = albums.find(a => a.id === e.target.value)
              onNodeClick(node)
            }}
            defaultValue=""
            style={{
              width: '100%',
              marginTop: 4,
              marginBottom: 8,
              cursor: 'pointer'
            }}
          >
            <option value="" disabled>— select an album —</option>
            {albums.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Songs (clickable list) */}
      {songs.length > 0 && (
        <div>
          <strong style={{ color: '#ccc' }}>Songs:</strong>
          <ul style={{ margin: '4px 0 8px 16px', padding: 0, listStyle: 'disc' }}>
            {songs.map(s => (
              <li
                key={s.id}
                onClick={() => onNodeClick(s)}
                style={{ cursor: 'pointer', color: '#fff' }}
              >
                {s.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Groups (clickable list) */}
      {groups.length > 0 && (
        <div>
          <strong style={{ color: '#ccc' }}>Groups:</strong>
          <ul style={{ margin: '4px 0 0 16px', padding: 0, listStyle: 'disc' }}>
            {groups.map(g => (
              <li
                key={g.id}
                onClick={() => onNodeClick(g)}
                style={{ cursor: 'pointer', color: '#fff' }}
              >
                {g.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}