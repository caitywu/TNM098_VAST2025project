import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { getSailorShiftGenres } from './GenreMetrics';

function computeGenreInfluenceMatrix(nodes, links, yearRange, mode = 'outgoing') {
  const [minYear, maxYear] = yearRange;
  const nodeById = new Map(nodes.map(n => [n.id, n]));
  const genreSet = new Set(nodes.map(n => n.genre).filter(Boolean));
  const genres = Array.from(genreSet);

  // Initialize matrix: source -> target genre counts
  const matrix = {};
  genres.forEach(src => {
    matrix[src] = {};
    genres.forEach(tgt => {
      matrix[src][tgt] = 0;
    });
  });

  links.forEach(link => {
    const source = nodeById.get(link.source);
    const target = nodeById.get(link.target);
    if (!source || !target) return;

    const year = parseInt(source.release_date);
    if (isNaN(year) || year < minYear || year > maxYear) return;

    const sourceGenre = source.genre;
    const targetGenre = target.genre;

    if (!sourceGenre || !targetGenre) return;

    if (mode === 'outgoing') {
      matrix[sourceGenre][targetGenre] += 1;
    } else if (mode === 'incoming') {
      matrix[targetGenre][sourceGenre] += 1;
    }
  });

  return { matrix, genres };
}



// export default function GenreInfluenceMatrix({ nodes, links, yearRange, mode }) {
//   // Reuse your matrix generation logic
//   const { matrix, genres } = computeGenreInfluenceMatrix(nodes, links, yearRange, mode);

//   // Alphabetize
//   genres.sort((a, b) => a.localeCompare(b));

//   // Get values for normalization
//   const values = genres.flatMap(row => genres.map(col => matrix[row][col])).filter(v => v > 0);
//   const minValue = Math.min(...values);
//   const maxValue = Math.max(...values);

//   // Log-based normalization
//   // function normalize(value) {
//   //   if (value === 0) return 0;
//   //   const logMin = Math.log(minValue + 1);
//   //   const logMax = Math.log(maxValue + 1);
//   //   return (Math.log(value + 1) - logMin) / (logMax - logMin);
//   // }

//   // Hybrid: Linear below threshold, Log above
//   function normalize(value) {
//   const threshold = 5;
//   if (value <= threshold) {
//     return value / threshold * 0.5;  // use half of scale
//   } else {
//     const logVal = Math.log(value - threshold + 1);
//     const logMax = Math.log(maxValue - threshold + 1);
//     return 0.5 + (logVal / logMax) * 0.5;
//   }
// }

//   // Color interpolation: white to red
//   function getColor(value) {
//     if (value === 0) return "#ffffff";
//     const intensity = normalize(value);
//     const red = 255;
//     const greenBlue = Math.round(255 * (1 - intensity));
//     return `rgb(${red}, ${greenBlue}, ${greenBlue})`;
//   }

//   const cellSize = 15;
//   const labelSize = 70;

//   return (
//     <div style={{ overflow: 'visible', width: '100%', height: 'auto'  }}>
//       <div style={{ display: 'flex', marginLeft: 30 }}>
//         {/* Top-left empty cell */}
//         <div style={{ width: labelSize, height: labelSize }} />
//         {/* Column labels */}
//         <div style={{ display: 'flex' }}>
//           {genres.map((genre, colIdx) => (
//             <div
//               key={colIdx}
//               style={{
//                 width: cellSize,
//                 height: labelSize,
//                 writingMode: 'vertical-rl',
//                 textAlign: 'left',
//                 fontSize: colIdx === 16 ? '10px' : '8px',
//                 transform: 'rotate(180deg)',
//                 padding: '1px',
//                 marginBottom: 15,
//                 fontWeight: colIdx === 16 ? 'bold' : 'normal',
//               }}
//               title={genre}
//             >
//               {genre}
//             </div>
//           ))}
//         </div>
//       </div>

//       <div style={{ display: 'flex' }}>
//         <div style={{ display: 'flex', flexDirection: 'column', marginRight: 20 }}>
//           {genres.map((rowGenre, rowIdx) => (
//             <div key={rowIdx} style={{ display: 'flex' }}>
//               {/* Row label */}
//               <div
//                 style={{
//                   width: labelSize,
//                   height: cellSize,
//                   fontSize: rowIdx === 16 ? '10px' : '8px',
//                   whiteSpace: 'nowrap',
//                   overflow: 'visible',
//                   textOverflow: 'ellipsis',
//                   padding: '1px',
//                   marginRight: 30,
//                   fontWeight: rowIdx === 16 ? 'bold' : 'normal',
//                 }}
//                 title={rowGenre}
//               >
//                 {rowGenre}
//               </div>
//               {/* Data cells */}
//               <div style={{ display: 'flex' }}>
//                 {genres.map((colGenre, colIdx) => {
//                   const value = matrix[rowGenre][colGenre];
//                   return (
//                     <div
//                       key={colIdx}
//                       style={{
//                         width: cellSize,
//                         height: cellSize,
//                         backgroundColor: getColor(value),
//                         border: '1px solid #ddd',
//                         cursor: value > 0 ? 'pointer' : 'default',
//                       }}
//                       title={`${value} from ${rowGenre} to ${colGenre}`}
//                     />
//                   );
//                 })}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }


export default function GenreInfluenceMatrix({ nodes, links, yearRange, mode }) {
  // Reuse your matrix generation logic
  const { matrix, genres } = computeGenreInfluenceMatrix(nodes, links, yearRange, mode);

  // Alphabetize genres
  genres.sort((a, b) => a.localeCompare(b));

  // Get Sailor Shift's genres
  const sailorShiftGenres = new Set(getSailorShiftGenres(nodes, links));

  // Get values for normalization
  const values = genres.flatMap(row => genres.map(col => matrix[row][col])).filter(v => v > 0);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  // Hybrid normalization: linear below threshold, log above
  function normalize(value) {
    const threshold = 5;
    if (value <= threshold) {
      return (value / threshold) * 0.5;
    } else {
      const logVal = Math.log(value - threshold + 1);
      const logMax = Math.log(maxValue - threshold + 1);
      return 0.5 + (logVal / logMax) * 0.5;
    }
  }

  // Color interpolation: white to red
  function getColor(value) {
    if (value === 0) return "#ffffff";
    const intensity = normalize(value);
    const red = 255;
    const greenBlue = Math.round(255 * (1 - intensity));
    return `rgb(${red}, ${greenBlue}, ${greenBlue})`;
  }

  const cellSize = 15;
  const labelSize = 70;

  return (
    <div style={{ overflow: 'visible', width: '100%', height: 'auto' }}>
      <div style={{ display: 'flex', marginLeft: 30 }}>
        {/* Top-left empty cell */}
        <div style={{ width: labelSize, height: labelSize }} />
        {/* Column labels */}
        <div style={{ display: 'flex' }}>
          {genres.map((genre, colIdx) => {
            const isSailorGenre = sailorShiftGenres.has(genre);
            return (
              <div
                key={colIdx}
                style={{
                  width: cellSize,
                  height: labelSize,
                  writingMode: 'vertical-rl',
                  textAlign: 'left',
                  fontSize: '8px',
                  transform: 'rotate(180deg)',
                  padding: '1px',
                  marginBottom: 15,
                  fontWeight: isSailorGenre ? 'bold' : 'normal',
                  fontStyle: isSailorGenre ? 'italic' : 'normal',
                }}
                title={genre}
              >
                {genre}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex' }}>
        <div style={{ display: 'flex', flexDirection: 'column', marginRight: 20 }}>
          {genres.map((rowGenre, rowIdx) => (
            <div key={rowIdx} style={{ display: 'flex' }}>
              {/* Row label */}
              <div
                style={{
                  width: labelSize,
                  height: cellSize,
                  fontSize: '8px',
                  whiteSpace: 'nowrap',
                  overflow: 'visible',
                  textOverflow: 'ellipsis',
                  padding: '1px',
                  marginRight: 30,
                  fontWeight: sailorShiftGenres.has(rowGenre) ? 'bold' : 'normal',
                  fontStyle: sailorShiftGenres.has(rowGenre) ? 'italic' : 'normal',
                }}
                title={rowGenre}
              >
                {rowGenre}
              </div>

              {/* Data cells */}
              <div style={{ display: 'flex' }}>
                {genres.map((colGenre, colIdx) => {
                  const value = matrix[rowGenre][colGenre];
                  return (
                    <div
                      key={colIdx}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: getColor(value),
                        border: '1px solid #ddd',
                        cursor: value > 0 ? 'pointer' : 'default',
                      }}
                      title={`${value} from ${rowGenre} to ${colGenre}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}