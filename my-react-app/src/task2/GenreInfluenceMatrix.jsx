import React from 'react';

export function GenreInfluenceMatrix({ matrix, genres, onCellHover }) {
  // Determine max value for scaling color intensity
  let maxValue = 0;
  genres.forEach(row => {
    genres.forEach(col => {
      if (matrix[row][col] > maxValue) maxValue = matrix[row][col];
    });
  });

  function getColor(value) {
    if (value === 0) return "#ffffff";
    const intensity = Math.min(1, value / maxValue);
    return `rgba(30, 144, 255, ${intensity})`;
  }

  const cellSize = 14; // in pixels
  const labelSize = 80; // row and column label size

  return (
    <div style={{ overflow: 'auto', maxHeight: '300px', maxWidth: '100%' }}>
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
                fontSize: '5px',
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
                  fontSize: '5px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  padding: '1px 1px',
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
