// src/EdgeFilter.jsx
import React from "react";

export default function EdgeFilter({ edgeTypes, visible, onToggle, onSelectAll, onDeselectAll }) {
  return (
    <fieldset style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
      <legend>Edge Types</legend>

      {/* New buttons */}
      <div style={{ marginBottom: '0.5rem' }}>
        <button type="button" onClick={onSelectAll} style={{ marginRight: 4 }}>
          Select All
        </button>
        <button type="button" onClick={onDeselectAll}>
          Deselect All
        </button>
      </div>

      {edgeTypes.map((type) => (
        <label key={type} style={{ display: "block", fontSize: "0.7rem" }}>
          <input
            type="checkbox"
            checked={visible.has(type)}
            onChange={() => onToggle(type)}
          />{" "}
          {type}
        </label>
      ))}
    </fieldset>
  );
}
