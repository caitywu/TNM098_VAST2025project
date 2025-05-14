// import React, { useEffect, useState } from 'react';
// import { loadGraphData } from './dataLoader';
// import { computeGenreMetrics } from './GenreMetrics';
// import ParallelPlot from './ParallelPlot';

// // Maps genre to color group
// function genreColor(genre) {
//   if (genre === "Oceanus Folk") return "red";
//   if (genre.toLowerCase().endsWith("rock")) return "#1f77b4";    // blue
//   if (genre.toLowerCase().endsWith("folk")) return "#2ca02c";    // green
//   if (genre.toLowerCase().endsWith("metal")) return "#9467bd";   // purple
//   if (genre.toLowerCase().endsWith("pop")) return "#ff7f0e";     // orange
//   return "#000000"; // other
// }

// export default function Task2Main() {
//   const [data, setData] = useState(null);
//   const [genreStats, setGenreStats] = useState([]);
//   const [highlightedGenre, setHighlightedGenre] = useState(null);

//   useEffect(() => {
//     loadGraphData('/MC1_graph.json').then(graph => {
//       setData(graph);
//       const stats = computeGenreMetrics(graph.nodes, graph.links);
//       setGenreStats(stats);
//     });
//   }, []);

//   const genreList = genreStats.map(g => g.genre).sort();

//   return (
//     <div>
//       <h4 style={{ position: 'fixed', top: '100px' }}>
//         Genre Overview: Parallel Coordinates
//       </h4>

//       <ParallelPlot data={genreStats} highlightedGenre={highlightedGenre} />

//       <div
//         style={{
//           position: 'fixed',
//           top: '246px',
//           right: '0',
//           width: '200px',
//           height: 'calc(100vh - 80px)',
//           maxHeight: '50vh',
//           overflowY: 'auto',
//           border: '1px solid #ccc',
//           backgroundColor: '#f9f9f9',
//           padding: '10px',
//           boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
//         }}
//       >
//         <h4 style={{ textAlign: 'center', marginBottom: '10px' }}>Genre List</h4>

//         <ul style={{ listStyleType: 'none', paddingLeft: '0', paddingRight: '10px' }}>
//           {genreList.map((genre, idx) => (
//             <li
//               key={idx}
//               style={{
//                 marginBottom: '5px',
//                 color: genreColor(genre),
//                 fontWeight: genre === highlightedGenre ? 'bold' : 'normal',
//                 cursor: 'pointer',
//               }}
//               onClick={() =>
//                 setHighlightedGenre(prev => (prev === genre ? null : genre))
//               }
//             >
//               {genre}
//             </li>
//           ))}
//         </ul>
//       </div>
//     </div>
//   );
// }


import React, { useEffect, useState } from 'react';
import { loadGraphData } from './dataLoader';
import { computeGenreMetrics } from './GenreMetrics';
import ParallelPlot from './ParallelPlot';

function genreColor(genre) {
  if (genre === "Oceanus Folk") return "red";
  if (genre.toLowerCase().endsWith("rock")) return "#1f77b4";
  if (genre.toLowerCase().endsWith("folk")) return "#2ca02c";
  if (genre.toLowerCase().endsWith("metal")) return "#9467bd";
  if (genre.toLowerCase().endsWith("pop")) return "#ff7f0e";
  return "#000000";
}

export default function Task2Main() {
  const [data, setData] = useState(null);
  const [genreStats, setGenreStats] = useState([]);
  const [highlightedGenre, setHighlightedGenre] = useState(null);
  const [yearRange, setYearRange] = useState([2000, 2030]);
  const [minMaxYear, setMinMaxYear] = useState([2000, 2030]);

  useEffect(() => {
    loadGraphData('/MC1_graph.json').then(graph => {
      setData(graph);

      const years = graph.nodes
        .filter(n => n.nodeType === "Song" || n["Node Type"] === "Song")
        .map(n => parseInt(n.release_date))
        .filter(y => !isNaN(y));

      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);

      setMinMaxYear([minYear, maxYear]);
      setYearRange([minYear, maxYear]);

      const stats = computeGenreMetrics(graph.nodes, graph.links, [minYear, maxYear]);
      setGenreStats(stats);
    });
  }, []);

  useEffect(() => {
    if (!data) return;
    const stats = computeGenreMetrics(data.nodes, data.links, yearRange);
    setGenreStats(stats);
  }, [yearRange, data]);

  const genreList = genreStats.map(g => g.genre).sort();

  return (
    <div>
      <h4 style={{ position: 'fixed', top: '100px' }}>
        Genre Overview: Parallel Coordinates
      </h4>

      <ParallelPlot data={genreStats} highlightedGenre={highlightedGenre} />

      <div style={{
        position: 'fixed',
        top: '246px',
        right: '0',
        width: '200px',
        height: 'calc(100vh - 80px)',
        maxHeight: '50vh',
        overflowY: 'auto',
        border: '1px solid #ccc',
        backgroundColor: '#f9f9f9',
        padding: '10px',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
      }}>
        <h4 style={{ textAlign: 'center', marginBottom: '10px' }}>Genre List</h4>
        <ul style={{ listStyleType: 'none', paddingLeft: '0', paddingRight: '10px' }}>
          {genreList.map((genre, idx) => (
            <li
              key={idx}
              style={{
                marginBottom: '5px',
                color: genreColor(genre),
                fontWeight: genre === highlightedGenre ? 'bold' : 'normal',
                cursor: 'pointer',
              }}
              onClick={() =>
                setHighlightedGenre(prev => (prev === genre ? null : genre))
              }
            >
              {genre}
            </li>
          ))}
        </ul>
      </div>

      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#fff',
        border: '1px solid #ccc',
        padding: '10px 20px',
        borderRadius: '8px',
        boxShadow: '0 0 5px rgba(0, 0, 0, 0.15)'
      }}>
        <label>
          Year Range: {yearRange[0]} – {yearRange[1]}
          <br />
          <input
  type="range"
  min={minMaxYear[0]}
  max={minMaxYear[1]}
  value={yearRange[0]}
  onChange={(e) => {
    const newStart = parseInt(e.target.value);
    setYearRange([Math.min(newStart, yearRange[1]), Math.max(newStart, yearRange[1])]);
  }}
  style={{ width: '300px', marginRight: '10px' }}
/>

<input
  type="range"
  min={minMaxYear[0]}
  max={minMaxYear[1]}
  value={yearRange[1]}
  onChange={(e) => {
    const newEnd = parseInt(e.target.value);
    setYearRange([Math.min(yearRange[0], newEnd), Math.max(yearRange[0], newEnd)]);
  }}
  style={{ width: '300px' }}
/>

        </label>
      </div>
    </div>
  );
}
