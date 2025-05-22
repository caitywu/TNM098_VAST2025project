import React, { useEffect, useState } from 'react';
import { loadGraphData } from './dataLoader';
import ReactSlider from 'react-slider';
import './CustomSlider.css';
import GenreInfluenceMatrix from './GenreInfluenceMatrix';

export default function GenreMatrixMain() {

  // States for dataset, year selection and mode
  const [data, setData] = useState(null);
  const [minMaxYear, setMinMaxYear] = useState([2000, 2030]);

  const [leftYearRange, setLeftYearRange] = useState([1975, 2040]);
  const [leftMode, setLeftMode] = useState('outgoing');

  const [rightYearRange, setRightYearRange] = useState([1975, 2040]);
  const [rightMode, setRightMode] = useState('outgoing');

  // Read dataset and get min/max years 
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

    // Left slider starts at full range
    setLeftYearRange([minYear, maxYear]);

    // Right slider starts at [2023, 2040]
    const desiredRightStart = 2023;
    const desiredRightEnd = 2040;
    const rightStart = Math.max(minYear, desiredRightStart);
    const rightEnd = Math.min(maxYear, desiredRightEnd);

    setRightYearRange([rightStart, rightEnd]);
  });
}, []);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 2px 1fr',
        gap: '20px',
        height: '100vh',
        padding: '20px',
        overflow: 'hidden',
      }}
    >
      {/* Left Matrix */}
      <div style={{ overflow: 'auto', maxHeight: '100%', display: 'flex', flexDirection: 'column' }}>
        <h4>Genre Influence Matrix (Left)</h4>

        {/* Checkbox for incoming/outgoing mode */}
        <label style={{ fontSize: '10px' }}>
          <input
            type="checkbox"
            checked={leftMode === 'incoming'}
            onChange={() =>
              setLeftMode(prev => (prev === 'outgoing' ? 'incoming' : 'outgoing'))
            }
          /> Show Incoming
        </label>
        
        {/* Year slider*/}
        <div style={{ marginTop: '8px', width: '80%' }}>
          <label style={{ color: '#000', fontWeight: 'bold' }}>
            Years: {leftYearRange[0]} – {leftYearRange[1]}
          </label>
          <ReactSlider
            className="custom-slider"
            thumbClassName="custom-thumb"
            trackClassName="custom-track"
            min={minMaxYear[0]}
            max={minMaxYear[1]}
            value={leftYearRange}
            onChange={setLeftYearRange}
            pearling
            minDistance={0}
          />
        </div>

        {/* Genre Influence Matrix */}
        {data && (
          <GenreInfluenceMatrix
            nodes={data.nodes}
            links={data.links}
            yearRange={leftYearRange}
            mode={leftMode}
          />
        )}
      </div>

      {/* Divider */}
      <div
        style={{
          width: '2px',
          backgroundColor: '#ccc',
          height: '100%',
        }}
      />

      {/* Right Matrix */}
      <div style={{ overflow: 'auto', maxHeight: '100%', display: 'flex', flexDirection: 'column' }}>
        <h4>Genre Influence Matrix (Right)</h4>

        {/* Checkbox for incoming/outgoing mode */}
        <label style={{ fontSize: '10px' }}>
          <input
            type="checkbox"
            checked={rightMode === 'incoming'}
            onChange={() =>
              setRightMode(prev => (prev === 'outgoing' ? 'incoming' : 'outgoing'))
            }
          /> Show Incoming
        </label>
        
        {/* Year slider*/}
        <div style={{ marginTop: '8px', width: '80%' }}>
          <label style={{ color: '#000', fontWeight: 'bold' }}>
            Years: {rightYearRange[0]} – {rightYearRange[1]}
          </label>
          <ReactSlider
            className="custom-slider"
            thumbClassName="custom-thumb"
            trackClassName="custom-track"
            min={minMaxYear[0]}
            max={minMaxYear[1]}
            value={rightYearRange}
            onChange={setRightYearRange}
            pearling
            minDistance={0}
          />
        </div>
        
        {/* Genre Influence Matrix */}
        {data && (
          <GenreInfluenceMatrix
            nodes={data.nodes}
            links={data.links}
            yearRange={rightYearRange}
            mode={rightMode}
          />
        )}
      </div>
    </div>
  );
}
