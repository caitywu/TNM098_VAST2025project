// log normalized values
import React from 'react';

export function GenreInfluenceMatrix({ matrix, genres, onCellHover }) {

  // Alphabetize genres
  genres.sort((a, b) => a.localeCompare(b));

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

  // Use log scaling to improve spread if maxValue is large
  // Add 1 to avoid log(0)
  function normalize(value) {
    if (value === 0) return 0;
    const logMin = Math.log(minValue + 1);
    const logMax = Math.log(maxValue + 1);
    return (Math.log(value + 1) - logMin) / (logMax - logMin);
  }

  
  function getColor(value) {
  if (value === 0) return "#ffffff";
  const intensity = normalize(value); // 0 to 1
  const red = 255;
  const greenBlue = Math.round(255 * (1 - intensity)); // 255 at white, 0 at red
  return `rgb(${red}, ${greenBlue}, ${greenBlue})`;
}

  const cellSize = 15; // in pixels
  const labelSize = 70; // row and column label size

  return (
    <div style={{ overflow: 'visible', width: '100%', height: 'auto' }}>
      <div style={{ display: 'flex', marginLeft: 30}}>
        {/* Empty corner cell */}
        <div style={{ width: labelSize, height: labelSize }} />

        {/* Column labels */}
        <div style={{ display: 'flex'}}>
          {genres.map((genre, colIdx) => (
  <div
    key={colIdx}
    style={{
      width: cellSize,
      height: labelSize,
      writingMode: 'vertical-rl',
      textAlign: 'left',
      // fontSize: '10px',
      fontSize: colIdx === 16 ? '10px' : '8px',  // Larger font for first label
      overflow: 'hidden',
      transform: 'rotate(180deg)',
      padding: '1px 1px',
      marginBottom: 15,
      fontWeight: colIdx === 16 ? 'bold' : 'normal',  // Bold only first label
      
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
        <div style={{ display: 'flex', flexDirection: 'column', marginRight: 20 }}>
          {genres.map((rowGenre, rowIdx) => (
            <div key={rowIdx} style={{ display: 'flex' }}>
              {/* Row label */}
            
              <div
                style={{
                  width: labelSize,
                  height: cellSize,
                  // fontSize: '10px',
                  fontSize: rowIdx === 16 ? '10px' : '8px',
                  whiteSpace: 'nowrap',
                  overflow: 'visible',
                  textOverflow: 'ellipsis',
                  padding: '1px 1px',
                  paddingRight: '3px',
                  marginRight: 30,
                  fontWeight: rowIdx === 16 ? 'bold' : 'normal',  // Bold only first label
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
