// import React, { useEffect, useState } from 'react';
// import { loadGraphData } from './dataLoader';
// import {
//   computeGenreMetrics,
//   computeOceanusFolkInfluences,
//   getSailorShiftGenres,
// } from './GenreMetrics';
// import ParallelPlot from './ParallelPlot';
// import OceanusFolkInfluenceBarChart from './BarChart';
// import ReactSlider from 'react-slider';
// import './CustomSlider.css';

// const dimensions = [
//   'songs',
//   'albums',
//   'recordLabels',
//   'notables',
//   'lyricistsAndComposers',
//   'artistsAndGroups',
// ];

// function genreColor(genre) {
//   if (genre === "Oceanus Folk") return "red";
//   if (genre.toLowerCase().endsWith("rock")) return "#1f77b4";
//   if (genre.toLowerCase().endsWith("folk")) return "#2ca02c";
//   if (genre.toLowerCase().endsWith("metal")) return "#9467bd";
//   if (genre.toLowerCase().endsWith("pop")) return "#ff7f0e";
//   return "#000000";
// }

// export default function Task2Main() {
//   const [data, setData] = useState(null);
//   const [genreStats, setGenreStats] = useState([]);
//   const [highlightedGenre, setHighlightedGenre] = useState(null);
//   const [yearRange, setYearRange] = useState([2000, 2030]);
//   const [minMaxYear, setMinMaxYear] = useState([2000, 2030]);
//   const [influenceData, setInfluenceData] = useState(null);
//   const [showSailorShiftGenres, setShowSailorShiftGenres] = useState(false);
//   const [globalDomain, setGlobalDomain] = useState(null);

//   useEffect(() => {
//     loadGraphData('/MC1_graph.json').then(graph => {
//       setData(graph);

//       const years = graph.nodes
//         .filter(n => n.nodeType === "Song" || n["Node Type"] === "Song")
//         .map(n => parseInt(n.release_date))
//         .filter(y => !isNaN(y));

//       const minYear = Math.min(...years);
//       const maxYear = Math.max(...years);

//       setMinMaxYear([minYear, maxYear]);
//       setYearRange([minYear, maxYear]);

//       const fullGenreStats = computeGenreMetrics(graph.nodes, graph.links, [minYear, maxYear]);
//       setGenreStats(fullGenreStats);
//       setInfluenceData(computeOceanusFolkInfluences(graph.nodes, graph.links, [minYear, maxYear]));

//       const newGlobalDomain = {};
//       for (const dim of dimensions) {
//         const values = fullGenreStats.map(d => d[dim]);
//         newGlobalDomain[dim] = [0, Math.max(...values)];
//       }
//       setGlobalDomain(newGlobalDomain);
//     });
//   }, []);

//   useEffect(() => {
//     if (!data) return;

//     const allStats = computeGenreMetrics(data.nodes, data.links, yearRange);

//     if (showSailorShiftGenres) {
//       const sailorGenres = getSailorShiftGenres(data.nodes, data.links, yearRange);
//       const filtered = allStats.filter(stat => sailorGenres.includes(stat.genre));
//       setGenreStats(filtered);
//     } else {
//       setGenreStats(allStats);
//     }

//     setInfluenceData(computeOceanusFolkInfluences(data.nodes, data.links, yearRange));
//   }, [yearRange, data, showSailorShiftGenres]);

//   const genreList = genreStats.map(g => g.genre).sort();

//   return (
//     <div
//       style={{
//         display: 'grid',
//         gridTemplateColumns: '2fr 1fr 1fr',
//         gridTemplateRows: '1fr 1fr',
//         gap: '3px',
//         padding: '10px',
//         height: '86vh',
//         boxSizing: 'border-box',
//         position: 'relative',
//       }}
//     >
//       {/* Top Left: Network Graph */}
//       <div style={{ gridColumn: '1 / 3', gridRow: '1', padding: '10px', borderRadius: '8px' }}>
//         <h2>Network Graph</h2>
//       </div>

//       {/* Top Right: Info Box */}
//       <div style={{ gridColumn: '3', gridRow: '1', padding: '10px', borderRadius: '8px', overflowY: 'auto' }}>
//         <h2>Info Box</h2>
//       </div>

//       {/* Bottom Left: Parallel Plot */}
//       <div style={{ gridColumn: '1', gridRow: '2', padding: '3px', borderRadius: '8px', maxWidth: '1300px' }}>
//         <h2>Parallel Plot</h2>
//         <ParallelPlot data={genreStats} highlightedGenre={highlightedGenre} globalDomain={globalDomain} />
//         <div style={{ marginTop: '10px' }}>
//           <label>
//             <input
//               type="checkbox"
//               checked={showSailorShiftGenres}
//               onChange={() => setShowSailorShiftGenres(prev => !prev)}
//               style={{ marginRight: '6px' }}
//             />
//             Show Only Sailor Shift Genres
//           </label>
//         </div>
//       </div>

//       {/* Bottom Middle: Genre List */}
//       <div
//         style={{
//           gridColumn: '2',
//           gridRow: '2',
//           padding: '10px',
//           backgroundColor: '#f9f9f9',
//           borderRadius: '8px',
//           overflowY: 'auto',
//           maxWidth: '280px',
//           justifySelf: 'end',
//         }}
//       >
//         <h2 style={{ textAlign: 'center' }}>Genre List</h2>
//         <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
//           {genreList.map((genre, idx) => (
//             <li
//               key={idx}
//               style={{
//                 marginBottom: '5px',
//                 color: genreColor(genre),
//                 fontWeight: genre === highlightedGenre ? 'bold' : 'normal',
//                 fontSize: '13px',
//                 cursor: 'pointer',
//               }}
//               onClick={() => setHighlightedGenre(prev => (prev === genre ? null : genre))}
//             >
//               {genre}
//             </li>
//           ))}
//         </ul>
//       </div>

//       {/* Bottom Right: Influence Charts */}
//       <div style={{
//         gridColumn: '3',
//         gridRow: '2',
//         display: 'flex',
//         flexDirection: 'column',
//         gap: '10px'
//       }}>
//         <div style={{ flex: 1, padding: '10px', borderRadius: '8px' }}>
//           <h4>Oceanus Folk Influence Types</h4>
//           <OceanusFolkInfluenceBarChart data={influenceData} />
//         </div>
//         <div style={{ flex: 1, padding: '10px', borderRadius: '8px' }}>
//           <h4>Oceanus Folk Over Time</h4>
//         </div>
//       </div>

//       {/* Time Slider */}
//       <div style={{
//         position: 'absolute',
//         bottom: '10px',
//         left: '50%',
//         transform: 'translateX(-50%)',
//         width: '40%',
//         padding: '10px',
//       }}>
//         <label style={{ color: '#000', fontWeight: 'bold' }}>
//           Year Range: {yearRange[0]} – {yearRange[1]}
//         </label>
//         <ReactSlider
//           className="custom-slider"
//           thumbClassName="custom-thumb"
//           trackClassName="custom-track"
//           min={minMaxYear[0]}
//           max={minMaxYear[1]}
//           value={yearRange}
//           onChange={setYearRange}
//           pearling
//           minDistance={1}
//         />
//       </div>
//     </div>
//   );
// }








// import React, { useEffect, useState } from 'react';
// import { loadGraphData } from './dataLoader';
// import {
//   computeGenreMetrics,
//   computeOceanusFolkInfluences,
//   getSailorShiftGenres,
// } from './GenreMetrics';
// import ParallelPlot from './ParallelPlot';
// import OceanusFolkInfluenceBarChart from './BarChart';
// import ReactSlider from 'react-slider';
// import './CustomSlider.css';

// const dimensions = [
//   'songs',
//   'albums',
//   'recordLabels',
//   'notables',
//   'lyricistsAndComposers',
//   'artistsAndGroups',
// ];

// function genreColor(genre) {
//   if (genre === "Oceanus Folk") return "red";
//   if (genre.toLowerCase().endsWith("rock")) return "#1f77b4";
//   if (genre.toLowerCase().endsWith("folk")) return "#2ca02c";
//   if (genre.toLowerCase().endsWith("metal")) return "#9467bd";
//   if (genre.toLowerCase().endsWith("pop")) return "#ff7f0e";
//   return "#000000";
// }

// export default function Task2Main() {
//   const [data, setData] = useState(null);
//   const [genreStats, setGenreStats] = useState([]);
//   const [highlightedGenre, setHighlightedGenre] = useState(null);
//   const [selectedYear, setSelectedYear] = useState(2000);
//   const [minMaxYear, setMinMaxYear] = useState([2000, 2030]);
//   const [influenceData, setInfluenceData] = useState(null);
//   const [showSailorShiftGenres, setShowSailorShiftGenres] = useState(false);
//   const [globalDomain, setGlobalDomain] = useState(null);

//   useEffect(() => {
//     loadGraphData('/MC1_graph.json').then(graph => {
//       setData(graph);

//       const years = graph.nodes
//         .filter(n => n.nodeType === "Song" || n["Node Type"] === "Song")
//         .map(n => parseInt(n.release_date))
//         .filter(y => !isNaN(y));

//       const minYear = Math.min(...years);
//       const maxYear = Math.max(...years);

//       setMinMaxYear([minYear, maxYear]);
//       setSelectedYear(minYear);

//       const fullGenreStats = computeGenreMetrics(graph.nodes, graph.links, [minYear, maxYear]);
//       setGlobalDomain(() => {
//         const domain = {};
//         for (const dim of dimensions) {
//           const values = fullGenreStats.map(d => d[dim]);
//           domain[dim] = [0, Math.max(...values)];
//         }
//         return domain;
//       });
//     });
//   }, []);

//   useEffect(() => {
//     if (!data) return;

//     const yearRange = [selectedYear, selectedYear];
//     const allStats = computeGenreMetrics(data.nodes, data.links, yearRange);

//     if (showSailorShiftGenres) {
//       const sailorGenres = getSailorShiftGenres(data.nodes, data.links, yearRange);
//       const filtered = allStats.filter(stat => sailorGenres.includes(stat.genre));
//       setGenreStats(filtered);
//     } else {
//       setGenreStats(allStats);
//     }

//     setInfluenceData(computeOceanusFolkInfluences(data.nodes, data.links, yearRange));
//   }, [selectedYear, data, showSailorShiftGenres]);

//   const genreList = genreStats.map(g => g.genre).sort();

//   const dynamicDomain = React.useMemo(() => {
//   if (!genreStats || genreStats.length === 0) return null;

//   const domain = {};
//   for (const dim of dimensions) {
//     const values = genreStats.map(d => d[dim]);
//     domain[dim] = [Math.min(...values), Math.max(...values)];
//   }
//   return domain;
// }, [genreStats]);

//   return (
//     <div
//       style={{
//         display: 'grid',
//         gridTemplateColumns: '2fr 1fr 1fr',
//         gridTemplateRows: '1fr 1fr',
//         gap: '3px',
//         padding: '10px',
//         height: '86vh',
//         boxSizing: 'border-box',
//         position: 'relative',
//       }}
//     >
//       {/* Top Left: Network Graph */}
//       <div style={{ gridColumn: '1 / 3', gridRow: '1', padding: '10px', borderRadius: '8px' }}>
//         <h2>Network Graph</h2>
//       </div>

//       {/* Top Right: Info Box */}
//       <div style={{ gridColumn: '3', gridRow: '1', padding: '10px', borderRadius: '8px', overflowY: 'auto' }}>
//         <h2>Info Box</h2>
//       </div>

//       {/* Bottom Left: Parallel Plot */}
//       <div style={{ gridColumn: '1', gridRow: '2', padding: '3px', borderRadius: '8px', maxWidth: '1300px' }}>
//         <h2>Parallel Plot</h2>
//         <ParallelPlot data={genreStats} highlightedGenre={highlightedGenre} globalDomain={dynamicDomain} />
//         <div style={{ marginTop: '10px' }}>
//           <label>
//             <input
//               type="checkbox"
//               checked={showSailorShiftGenres}
//               onChange={() => setShowSailorShiftGenres(prev => !prev)}
//               style={{ marginRight: '6px' }}
//             />
//             Show Only Sailor Shift Genres
//           </label>
//         </div>
//       </div>

//       {/* Bottom Middle: Genre List */}
//       <div
//         style={{
//           gridColumn: '2',
//           gridRow: '2',
//           padding: '10px',
//           backgroundColor: '#f9f9f9',
//           borderRadius: '8px',
//           overflowY: 'auto',
//           maxWidth: '280px',
//           justifySelf: 'end',
//         }}
//       >
//         <h2 style={{ textAlign: 'center' }}>Genre List</h2>
//         <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
//           {genreList.map((genre, idx) => (
//             <li
//               key={idx}
//               style={{
//                 marginBottom: '5px',
//                 color: genreColor(genre),
//                 fontWeight: genre === highlightedGenre ? 'bold' : 'normal',
//                 fontSize: '13px',
//                 cursor: 'pointer',
//               }}
//               onClick={() => setHighlightedGenre(prev => (prev === genre ? null : genre))}
//             >
//               {genre}
//             </li>
//           ))}
//         </ul>
//       </div>

//       {/* Bottom Right: Influence Charts */}
//       <div style={{
//         gridColumn: '3',
//         gridRow: '2',
//         display: 'flex',
//         flexDirection: 'column',
//         gap: '10px'
//       }}>
//         <div style={{ flex: 1, padding: '10px', borderRadius: '8px' }}>
//           <h4>Oceanus Folk Influence Types</h4>
//           <OceanusFolkInfluenceBarChart data={influenceData} />
//         </div>
//         <div style={{ flex: 1, padding: '10px', borderRadius: '8px' }}>
//           <h4>Oceanus Folk Over Time</h4>
//         </div>
//       </div>

//       {/* Single Year Slider */}
//       <div style={{
//         position: 'absolute',
//         bottom: '10px',
//         left: '50%',
//         transform: 'translateX(-50%)',
//         width: '40%',
//         padding: '10px',
//       }}>
//         <label style={{ color: '#000', fontWeight: 'bold' }}>
//           Year: {selectedYear}
//         </label>
//         <ReactSlider
//           className="custom-slider"
//           thumbClassName="custom-thumb"
//           trackClassName="custom-track"
//           min={minMaxYear[0]}
//           max={minMaxYear[1]}
//           value={selectedYear}
//           onChange={setSelectedYear}
//         />
//       </div>
//     </div>
//   );
// }







import React, { useEffect, useState } from 'react';
import { loadGraphData } from './dataLoader';
import {
  computeGenreMetrics,
  computeOceanusFolkInfluences,
  getSailorShiftGenres,
  computeGenreInfluenceMatrix
} from './GenreMetrics';
import ParallelPlot from './ParallelPlot';
import OceanusFolkInfluenceBarChart from './BarChart';
import ReactSlider from 'react-slider';
import { GenreInfluenceMatrix } from './GenreInfluenceMatrix';
import './CustomSlider.css';

// // Heatmap matrix component included here for completeness
// function GenreInfluenceMatrix({ matrix, genres, onCellHover }) {
//   let maxValue = 0;
//   genres.forEach(row => {
//     genres.forEach(col => {
//       if (matrix[row][col] > maxValue) maxValue = matrix[row][col];
//     });
//   });

//   function getColor(value) {
//     if (value === 0) return "#fff";
//     const intensity = Math.min(1, value / maxValue);
//     return `rgba(30, 144, 255, ${intensity})`;
//   }

//   return (
//     <div style={{ overflowX: 'auto', maxHeight: '500px', fontSize: 10 }}>
//       <table style={{ borderCollapse: 'collapse', width: '100%' }}>
//         <thead>
//           <tr>
//             <th style={{ border: '1px solid #ccc', padding: 2, background: '#eee' }}>From \ To</th>
//             {genres.map((g, i) => (
//               <th key={i} style={{ border: '1px solid #ccc', padding: 2, background: '#eee', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
//                 {g}
//               </th>
//             ))}
//           </tr>
//         </thead>
//         <tbody>
//           {genres.map((rowGenre, i) => (
//             <tr key={i}>
//               <td style={{ border: '1px solid #ccc', padding: 2, background: '#eee' }}>{rowGenre}</td>
//               {genres.map((colGenre, j) => {
//                 const value = matrix[rowGenre][colGenre];
//                 return (
//                   <td
//                     key={j}
//                     style={{
//                       border: '1px solid #ccc',
//                       padding: 5,
//                       backgroundColor: getColor(value),
//                       textAlign: 'center',
//                       cursor: 'default',
//                     }}
//                     title={`${value} influences from ${rowGenre} to ${colGenre}`}
//                     onMouseEnter={() => onCellHover && onCellHover(rowGenre, colGenre, value)}
//                     onMouseLeave={() => onCellHover && onCellHover(null, null, 0)}
//                   >
//                     {value > 0 ? value : ''}
//                   </td>
//                 );
//               })}
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

const dimensions = [
  'songs',
  'albums',
  'recordLabels',
  'notables',
  'lyricistsAndComposers',
  'artistsAndGroups',
];

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
  const [selectedYear, setSelectedYear] = useState(2000);
  const [minMaxYear, setMinMaxYear] = useState([2000, 2030]);
  const [influenceData, setInfluenceData] = useState(null);
  const [showSailorShiftGenres, setShowSailorShiftGenres] = useState(false);
  const [globalDomain, setGlobalDomain] = useState(null);

  // New state for influence matrix and direction toggle
  const [influenceMatrixData, setInfluenceMatrixData] = useState(null);
  const [reverseDirection, setReverseDirection] = useState(false);

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
      setSelectedYear(minYear);

      const fullGenreStats = computeGenreMetrics(graph.nodes, graph.links, [minYear, maxYear]);
      setGlobalDomain(() => {
        const domain = {};
        for (const dim of dimensions) {
          const values = fullGenreStats.map(d => d[dim]);
          domain[dim] = [0, Math.max(...values)];
        }
        return domain;
      });
    });
  }, []);

  // Update genre stats, influence data and influence matrix when year, data or toggle changes
  useEffect(() => {
    if (!data) return;

    const yearRange = [selectedYear, selectedYear];
    const allStats = computeGenreMetrics(data.nodes, data.links, yearRange);

    if (showSailorShiftGenres) {
      const sailorGenres = getSailorShiftGenres(data.nodes, data.links, yearRange);
      const filtered = allStats.filter(stat => sailorGenres.includes(stat.genre));
      setGenreStats(filtered);
    } else {
      setGenreStats(allStats);
    }

    setInfluenceData(computeOceanusFolkInfluences(data.nodes, data.links, yearRange));

    // Compute influence matrix with reverse direction toggle
    const { matrix, genres } = computeGenreInfluenceMatrix(data.nodes, data.links, yearRange, reverseDirection);
    setInfluenceMatrixData({ matrix, genres });
  }, [selectedYear, data, showSailorShiftGenres, reverseDirection]);

  const genreList = genreStats.map(g => g.genre).sort();

  const dynamicDomain = React.useMemo(() => {
    if (!genreStats || genreStats.length === 0) return null;

    const domain = {};
    for (const dim of dimensions) {
      const values = genreStats.map(d => d[dim]);
      domain[dim] = [Math.min(...values), Math.max(...values)];
    }
    return domain;
  }, [genreStats]);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: '3px',
        padding: '10px',
        height: '86vh',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      {/* Top Left: Genre Influence Matrix with checkbox */}
      <div style={{ gridColumn: '1 / 3', gridRow: '1', padding: '10px', borderRadius: '8px', overflow: 'auto' }}>
        <h2>Genre Influence Matrix</h2>
        <label style={{ userSelect: 'none', marginBottom: '8px', display: 'inline-block' }}>
          <input
            type="checkbox"
            checked={reverseDirection}
            onChange={e => setReverseDirection(e.target.checked)}
            style={{ marginRight: 6 }}
          />
          Show influence in reverse direction
        </label>
        {influenceMatrixData ? (
          <GenreInfluenceMatrix
            matrix={influenceMatrixData.matrix}
            genres={influenceMatrixData.genres}
          />
        ) : (
          <p>Loading matrix...</p>
        )}
      </div>

      {/* Top Right: Info Box */}
      <div style={{ gridColumn: '3', gridRow: '1', padding: '10px', borderRadius: '8px', overflowY: 'auto' }}>
        <h2>Info Box</h2>
      </div>

      {/* Bottom Left: Parallel Plot */}
      <div style={{ gridColumn: '1', gridRow: '2', padding: '3px', borderRadius: '8px', maxWidth: '1300px' }}>
        <h2>Parallel Plot</h2>
        <ParallelPlot data={genreStats} highlightedGenre={highlightedGenre} globalDomain={dynamicDomain} />
        <div style={{ marginTop: '10px' }}>
          <label>
            <input
              type="checkbox"
              checked={showSailorShiftGenres}
              onChange={() => setShowSailorShiftGenres(prev => !prev)}
              style={{ marginRight: '6px' }}
            />
            Show Only Sailor Shift Genres
          </label>
        </div>
      </div>

      {/* Bottom Middle: Genre List */}
      <div
        style={{
          gridColumn: '2',
          gridRow: '2',
          padding: '10px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          overflowY: 'auto',
          maxWidth: '280px',
          justifySelf: 'end',
        }}
      >
        <h2 style={{ textAlign: 'center' }}>Genre List</h2>
        <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
          {genreList.map((genre, idx) => (
            <li
              key={idx}
              style={{
                marginBottom: '5px',
                color: genreColor(genre),
                fontWeight: genre === highlightedGenre ? 'bold' : 'normal',
                fontSize: '13px',
                cursor: 'pointer',
              }}
              onClick={() => setHighlightedGenre(prev => (prev === genre ? null : genre))}
            >
              {genre}
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom Right: Influence Charts */}
       <div style={{
        gridColumn: '3',
        gridRow: '2',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{ flex: 1, padding: '10px', borderRadius: '8px' }}>
          <h4>Oceanus Folk Influence Types</h4>
          <OceanusFolkInfluenceBarChart data={influenceData} />
        </div>
        <div style={{ flex: 1, padding: '10px', borderRadius: '8px' }}>
          <h4>Oceanus Folk Over Time</h4>
        </div>
      </div>

      {/* Single Year Slider */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '40%',
        padding: '10px',
      }}>
        <label style={{ color: '#000', fontWeight: 'bold' }}>
          Year: {selectedYear}
        </label>
        <ReactSlider
          className="custom-slider"
          thumbClassName="custom-thumb"
          trackClassName="custom-track"
          min={minMaxYear[0]}
          max={minMaxYear[1]}
          value={selectedYear}
          onChange={setSelectedYear}
        />
      </div>
    </div>
  );
}
