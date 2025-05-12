// src/EdgeFilter.jsx
import React from "react";

export default function EdgeFilter({ edgeTypes, visible, onToggle }) {
  return (
    <fieldset style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
      <legend>Edge Types</legend>
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
