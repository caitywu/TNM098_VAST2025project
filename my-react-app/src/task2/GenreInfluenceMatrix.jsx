import React, { useState } from 'react';
import * as d3 from 'd3';
import { getSailorShiftGenres } from './GenreMetrics';

/**
 * Utility function to compute counts for the genre influence matrix
 * @param {array} - Nodes from dataset
 * @param {array} - Edges from dataset
 * @param {array} - [minYear, maxYear]
 * @param {string} -'outgoing' or 'incoming' influence direction
 * @returns {object} { matrix: { [genre]: { [genre]: number } }, genres: array<string> }
 */
function computeGenreInfluenceMatrix(nodes, links, yearRange, mode = 'outgoing') {
  const [minYear, maxYear] = yearRange;
  const nodeById = new Map(nodes.map(n => [n.id, n]));
  const genreSet = new Set(nodes.map(n => n.genre).filter(Boolean));
  const genres = Array.from(genreSet);

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

    const year = parseInt(target.release_date);
    if (isNaN(year) || year < minYear || year > maxYear) return;

    const sourceGenre = source.genre;
    const targetGenre = target.genre;

    if (!sourceGenre || !targetGenre) return;

    const influencerGenre = targetGenre;
    const influencedGenre = sourceGenre;

    if (mode === 'outgoing') {
      matrix[influencerGenre][influencedGenre] += 1;
    } else if (mode === 'incoming') {
      matrix[influencedGenre][influencerGenre] += 1;
    }
  });

  return { matrix, genres };
}



/**
 * A matrix showing in- and outgoing influence counts between al l genres with a white to red heat map. <br> 
 * Can filter on year rannge and influence direction.
 * @param {{ nodes: array, links: array, yearRange: array, mode: string }} - Nodes and links from dataset, year range and direction
 * @returns {ReactElement} - Genre influence matrix component
 */
export default function GenreInfluenceMatrix({ nodes, links, yearRange, mode }) {
  // Compute the genre influence matrix
  const { matrix, genres } = computeGenreInfluenceMatrix(nodes, links, yearRange, mode);

  // State for genre selection + highlighting
  const [selectedGenre, setSelectedGenre] = useState(null);

  // Sort genres and extract Sailor Shift genres
  genres.sort((a, b) => a.localeCompare(b));
  const sailorShiftGenres = new Set(getSailorShiftGenres(nodes, links));

  // Get values for normalization
  const values = genres.flatMap(row => genres.map(col => matrix[row][col])).filter(v => v > 0);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  // Hybrid normalization --> linear below threshold, log above to prevent invisible or
  //  misleadingly strong colors
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

  // Color interpolation heat map --> white to red
  function getColor(value) {
    if (value === 0) return "#ffffff";
    const intensity = normalize(value);
    const red = 255;
    const greenBlue = Math.round(255 * (1 - intensity));
    return `rgb(${red}, ${greenBlue}, ${greenBlue})`;
  }

  // Matrix cell sizes
  const cellSize = 15;
  const labelSize = 70;

  return (
    <div style={{ overflow: 'visible', width: '100%', height: 'auto' }}>
      <div style={{ display: 'flex', marginLeft: 30 }}>
        {/* Top-left empty cell */}
        <div style={{ width: labelSize, height: labelSize }} />

        {/* Column labels */}
        <div style={{ display: 'flex' }}>
          {/* Print genre lablels verically and mark Sailor Shift genres */}
          {genres.map((genre, colIdx) => {
            const isSailorGenre = sailorShiftGenres.has(genre);
            return (
              <div
                key={colIdx}
                onClick={() => setSelectedGenre(prev => (prev === genre ? null : genre))}
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
                  cursor: 'pointer',
                  opacity: selectedGenre && selectedGenre !== genre ? 0.2 : 1,
                  transition: 'opacity 0.2s',
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
        {/* Print genre lablels horizontally and mark Sailor Shift genres */}
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
                  cursor: 'pointer',
                  opacity: selectedGenre && selectedGenre !== rowGenre ? 0.2 : 1,
                  transition: 'opacity 0.2s',
                }}
                title={rowGenre}
                onClick={() => setSelectedGenre(prev => (prev === rowGenre ? null : rowGenre))}
              >
                {rowGenre}
              </div>

              {/* Data cells */}
              <div style={{ display: 'flex' }}>
                {genres.map((colGenre, colIdx) => {
                  const value = matrix[rowGenre][colGenre];
                  const faded =
                    selectedGenre &&
                    selectedGenre !== rowGenre &&
                    selectedGenre !== colGenre;

                  return (
                    <div
                      key={colIdx}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: getColor(value),
                        border: '1px solid #ddd',
                        cursor: value > 0 ? 'pointer' : 'default',
                        opacity: faded ? 0.1 : 1,
                        transition: 'opacity 0.2s',
                      }}
                      // Tooltip
                      title={`${colGenre} has taken ${value} influences from ${rowGenre}`}
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
