// Task2Main.jsx
// export default function Task2Main() {
//   return (
//     <div>
//       <h2>Task 2 Page</h2>
//       <p>This is the content for the second page!!</p>
//     </div>
//   );
// }

import React, { useEffect, useState } from 'react';
import { loadGraphData } from './dataLoader';
import { computeGenreMetrics } from './GenreMetrics';
import ParallelPlot from './ParallelPlot';

// Maps genre to color group
function genreColor(genre) {
  if (genre === "Oceanus Folk") return "red";
  if (genre.toLowerCase().endsWith("rock")) return "#1f77b4";    // blue
  if (genre.toLowerCase().endsWith("folk")) return "#2ca02c";    // green
  if (genre.toLowerCase().endsWith("metal")) return "#9467bd";   // purple
  if (genre.toLowerCase().endsWith("pop")) return "#ff7f0e";     // orange
  return "#000000"; // other
}

export default function Task2Main() {
  const [data, setData] = useState(null);
  const [genreStats, setGenreStats] = useState([]);

  useEffect(() => {
    loadGraphData('/MC1_graph.json').then(graph => {
      setData(graph);
      const stats = computeGenreMetrics(graph.nodes, graph.links);
      setGenreStats(stats);
    });
  }, []);

  const genreList = genreStats.map(g => g.genre).sort();

  return (
    <div>

      {/* Style the h2 header */}
      <h4 style={{ position: 'fixed', top: '100px' }}>
        Genre Overview: Parallel Coordinates
      </h4>

      <ParallelPlot data={genreStats} />

      <h3>Genres Found ({genreList.length}):</h3>

      {/* Scrollable Panel on Right Edge */}
      <div
        style={{
          position: 'fixed',
          top: '246px',
          right: '0',
          width: '200px', // Thin panel width
          height: 'calc(100vh - 80px)',
          maxHeight: '50vh', // Max height of the panel
          overflowY: 'auto',
          border: '1px solid #ccc',
          backgroundColor: '#f9f9f9',
          padding: '10px',
          boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Title for the genre list */}
        <h4 style={{ textAlign: 'center', marginBottom: '10px' }}>Genre List</h4>

        {/* Genre List */}
        <ul style={{ listStyleType: 'none', paddingLeft: '0' }}>
          {genreList.map((genre, idx) => (
            <li key={idx} style={{ marginBottom: '5px', color: genreColor(genre) }}>
              {genre}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

