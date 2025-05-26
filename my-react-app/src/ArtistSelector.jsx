// src/ArtistSelector.jsx
import React, { useState, useMemo } from "react";

export default function ArtistSelector({ nodes, selectedIds, onChange }) {
  const [query, setQuery] = useState("");

  // Filtrera & sortera alfabetiskt
  const filtered = useMemo(() => {
    return nodes
      .filter((n) => {
        const name = n.name || n.stage_name || "";
        return name.toLowerCase().includes(query.toLowerCase());
      })
      .sort((a, b) => {
        const na = (a.name || a.stage_name || "").toLowerCase();
        const nb = (b.name || b.stage_name || "").toLowerCase();
        return na.localeCompare(nb);
      });
  }, [nodes, query]);

  return (
    <div>
      <input
        type="text"
        placeholder="Search artist…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: "100%",
          padding: "0.5rem",
          marginBottom: "0.5rem",
          boxSizing: "border-box",
        }}
      />
      <ul style={{ maxHeight: 200, overflowY: "auto", padding: 0, margin: 0 }}>
        {filtered.map((n) => {
          const name = n.name || n.stage_name || n.id;
          const isSelected = selectedIds.includes(n.id);
          return (
            <li
              key={n.id}
              onClick={() => onChange([n.id])}
              style={{
                listStyle: "none",
                padding: "0.25rem 0.5rem",
                cursor: "pointer",
                background: isSelected ? "#ddd" : "transparent",
              }}
            >
              {name}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
