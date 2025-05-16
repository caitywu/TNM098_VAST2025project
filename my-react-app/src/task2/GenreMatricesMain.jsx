import React, { useEffect, useState } from 'react';
import { loadGraphData } from './dataLoader';
import { computeGenreInfluenceMatrix } from './GenreMetrics';
import { GenreInfluenceMatrix } from './GenreInfluenceMatrix';
import ReactSlider from 'react-slider';
import './CustomSlider.css';

export default function GenreMatrixMain() {
  const [data, setData] = useState(null);
  const [selectedYearRange, setSelectedYearRange] = useState([2000, 2000]);
  const [minMaxYear, setMinMaxYear] = useState([2000, 2030]);
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
      setSelectedYearRange([minYear, maxYear]); // full range initially
    });
  }, []);

  useEffect(() => {
    if (!data) return;

    const { matrix, genres } = computeGenreInfluenceMatrix(
      data.nodes,
      data.links,
      selectedYearRange,
      reverseDirection
    );

    const newData = { matrix, genres };
    const dataString = JSON.stringify(newData);
    const prevString = JSON.stringify(influenceMatrixData);

    if (dataString !== prevString) {
      setInfluenceMatrixData(newData);
    }
  }, [data, selectedYearRange, reverseDirection]);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        height: '90vh',
        padding: '20px',
      }}
    >
      {/* Left Placeholder */}
      <div style={{ border: '1px dashed #aaa', borderRadius: '8px', padding: '10px' }}>
        <h3>Placeholder for another matrix</h3>
      </div>

      {/* Right: Influence Matrix */}
      <div style={{ overflow: 'visible', justifySelf: 'end' }}>
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

        {/* Year Range Slider */}
        <div style={{ marginTop: '20px', width: '80%' }}>
          <label style={{ color: '#000', fontWeight: 'bold' }}>
            Years: {selectedYearRange[0]} – {selectedYearRange[1]}
          </label>
          <ReactSlider
            className="custom-slider"
            thumbClassName="custom-thumb"
            trackClassName="custom-track"
            min={minMaxYear[0]}
            max={minMaxYear[1]}
            value={selectedYearRange}
            onChange={setSelectedYearRange}
            pearling
            minDistance={1}
          />
        </div>
      </div>
    </div>
  );
}
