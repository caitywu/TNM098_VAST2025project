// import React from 'react';

// export function GenreInfluenceMatrix({ matrix, genres, onCellHover }) {
//   // Determine max value for scaling color intensity
//   let maxValue = 0;
//   genres.forEach(row => {
//     genres.forEach(col => {
//       if (matrix[row][col] > maxValue) maxValue = matrix[row][col];
//     });
//   });

//   // infrared color range
//   function getColor(value) {
//   if (value === 0) return "#ffffff";

//   const intensity = Math.min(1, value / maxValue);

//   // Infrared-like color scale from blue to red
//   const hue = (1 - intensity) * 240; // 240 = blue, 0 = red
//   return `hsl(${hue}, 100%, 50%)`;
// }

//   const cellSize = 15; // in pixels
//   const labelSize = 70; // row and column label size

//   return (
//     <div style={{ overflow: 'visible', width: '100%', height: 'auto' }}>
//       <div style={{ display: 'flex' }}>
//         {/* Empty corner cell */}
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
//                 fontSize: '10px',
//                 overflow: 'hidden',
//                 transform: 'rotate(180deg)',
//                 padding: '1px 1px',
//               }}
//               title={genre}
//             >
//               {genre}
//             </div>
//           ))}
//         </div>
//       </div>

//       <div style={{ display: 'flex' }}>
//         {/* Row labels and data cells */}
//         <div style={{ display: 'flex', flexDirection: 'column' }}>
//           {genres.map((rowGenre, rowIdx) => (
//             <div key={rowIdx} style={{ display: 'flex' }}>
//               {/* Row label */}
//               <div
//                 style={{
//                   width: labelSize,
//                   height: cellSize,
//                   fontSize: '10px',
//                   whiteSpace: 'nowrap',
//                   overflow: 'visible',
//                   textOverflow: 'ellipsis',
//                   padding: '1px 1px',
//                   paddingRight: '3px',
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
//                       onMouseEnter={() => onCellHover?.(rowGenre, colGenre, value)}
//                       onMouseLeave={() => onCellHover?.(null, null, 0)}
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




// log normalized values
import React from 'react';

export function GenreInfluenceMatrix({ matrix, genres, onCellHover }) {
  // Flatten values to an array for stats
  const values = [];
  genres.forEach(row => {
    genres.forEach(col => {
      const v = matrix[row][col];
      if (v > 0) values.push(v);
    });
  });

  // Basic normalization: min & max of values
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  // Optional: Use log scaling to improve spread if maxValue is large
  // Add 1 to avoid log(0)
  function normalize(value) {
    if (value === 0) return 0;
    const logMin = Math.log(minValue + 1);
    const logMax = Math.log(maxValue + 1);
    return (Math.log(value + 1) - logMin) / (logMax - logMin);
  }

  // Infrared color range
  function getColor(value) {
    if (value === 0) return "#ffffff";
    const intensity = normalize(value);

    // Infrared-like color scale from blue to red
    const hue = (1 - intensity) * 240; // 240 = blue, 0 = red
    return `hsl(${hue}, 100%, 50%)`;
  }

  const cellSize = 15; // in pixels
  const labelSize = 70; // row and column label size

  return (
    <div style={{ overflow: 'visible', width: '100%', height: 'auto' }}>
      <div style={{ display: 'flex' }}>
        {/* Empty corner cell */}
        <div style={{ width: labelSize, height: labelSize }} />

        {/* Column labels */}
        <div style={{ display: 'flex' }}>
          {genres.map((genre, colIdx) => (
            <div
              key={colIdx}
              style={{
                width: cellSize,
                height: labelSize,
                writingMode: 'vertical-rl',
                textAlign: 'left',
                fontSize: '10px',
                overflow: 'hidden',
                transform: 'rotate(180deg)',
                padding: '1px 1px',
              }}
              title={genre}
            >
              {genre}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex' }}>
        {/* Row labels and data cells */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {genres.map((rowGenre, rowIdx) => (
            <div key={rowIdx} style={{ display: 'flex' }}>
              {/* Row label */}
              <div
                style={{
                  width: labelSize,
                  height: cellSize,
                  fontSize: '10px',
                  whiteSpace: 'nowrap',
                  overflow: 'visible',
                  textOverflow: 'ellipsis',
                  padding: '1px 1px',
                  paddingRight: '3px',
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
                      onMouseEnter={() => onCellHover?.(rowGenre, colGenre, value)}
                      onMouseLeave={() => onCellHover?.(null, null, 0)}
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
