import React from 'react'

export default function ArtistSelector({
  options,
  selectedIds,
  onChange
}) {
  return (
    <div>
      {/* <h2>Multi-Artist Network</h2> */}
      <label style={{ fontSize: 10 }}>Select Artists:</label><br/>
      <select
        multiple
        value={selectedIds}
        onChange={e =>
          onChange(
            Array.from(e.target.selectedOptions, o => o.value)
          )
        }
        style={{ width: 300, height: 200 }}
      >
        {options.map(n => (
          <option key={n.id} value={n.id}>
            {n.name || n.stage_name || n.id}
          </option>
        ))}
      </select>
    </div>
  )
}
