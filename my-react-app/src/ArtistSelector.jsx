import React, { useState, useMemo } from "react";

const CATEGORIES = [
  { key: "producers", label: "Producer" },
  { key: "performers", label: "Performer" },
  { key: "albums", label: "Album" },
  { key: "groups", label: "Musical Group" },
  { key: "songs", label: "Song" },
  { key: "labels", label: "Record Label" },
];

export default function ArtistSelector({
  nodes,
  links,
  selectedIds,
  onChange,
}) {
  const [activeCats, setActiveCats] = useState(
    new Set(["producers", "performers"])
  );

  // 1) Precompute sets of IDs for each category
  const { producerSet, performerSet, albumSet, groupSet, songSet, labelSet } =
    useMemo(() => {
      const pSet = new Set();
      const fSet = new Set();
      links.forEach((l) => {
        if (l["Edge Type"] === "ProducerOf") pSet.add(l.source);
        if (l["Edge Type"] === "PerformerOf") fSet.add(l.source);
      });
      const aSet = new Set(
        nodes.filter((n) => n["Node Type"] === "Album").map((n) => String(n.id))
      );
      const gSet = new Set(
        nodes
          .filter((n) => n["Node Type"] === "MusicalGroup")
          .map((n) => String(n.id))
      );
      const sSet = new Set(
        nodes.filter((n) => n["Node Type"] === "Song").map((n) => String(n.id))
      );
      const lSet = new Set(
        nodes
          .filter((n) => n["Node Type"] === "RecordLabel")
          .map((n) => String(n.id))
      );
      return {
        producerSet: pSet,
        performerSet: fSet,
        albumSet: aSet,
        groupSet: gSet,
        songSet: sSet,
        labelSet: lSet,
      };
    }, [nodes, links]);

  // 2) Compute filtered list
  const filtered = useMemo(() => {
    return nodes.filter((n) => {
      const id = String(n.id);
      // if none active, show nothing
      if (!activeCats.size) return false;

      // if this category is active and node matches it, include
      if (activeCats.has("producers") && producerSet.has(id)) return true;
      if (activeCats.has("performers") && performerSet.has(id)) return true;
      if (activeCats.has("albums") && albumSet.has(id)) return true;
      if (activeCats.has("groups") && groupSet.has(id)) return true;
      if (activeCats.has("songs") && songSet.has(id)) return true;
      if (activeCats.has("labels") && labelSet.has(id)) return true;

      return false;
    });
    // we only care when the user toggles categories or the underlying sets change
  }, [
    nodes,
    activeCats,
    producerSet,
    performerSet,
    albumSet,
    groupSet,
    songSet,
    labelSet,
  ]);

  function toggleCat(key) {
    const next = new Set(activeCats);
    next.has(key) ? next.delete(key) : next.add(key);
    setActiveCats(next);
  }

  return (
    <div>
      <h2>Multi-Artist Network</h2>

      {/* Category checkboxes */}
      <fieldset style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
        <legend>
          <strong>Show:</strong>
        </legend>
        {CATEGORIES.map((cat) => (
          <label
            key={cat.key}
            style={{ display: "block", margin: "0.25rem 0" }}
          >
            <input
              type="checkbox"
              checked={activeCats.has(cat.key)}
              onChange={() => toggleCat(cat.key)}
            />{" "}
            {cat.label}
          </label>
        ))}
      </fieldset>

      {/* The multi-select */}
      <label style={{ marginTop: "1rem", display: "block" }}>
        Select{" "}
        {activeCats.has("songs") || activeCats.has("albums")
          ? "Items"
          : "Artists"}
        :
      </label>
      <select
        multiple
        size={10}
        value={selectedIds}
        onChange={(e) =>
          onChange(Array.from(e.target.selectedOptions, (o) => o.value))
        }
        style={{ width: "100%", minHeight: 200 }}
      >
        {filtered.map((n) => (
          <option key={n.id} value={String(n.id)}>
            {n.name || n.stage_name || `[${n["Node Type"]}] ${n.id}`}
          </option>
        ))}
      </select>
    </div>
  );
}