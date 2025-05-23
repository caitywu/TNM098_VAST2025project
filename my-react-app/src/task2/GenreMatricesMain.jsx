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

  const [isInfoOpen, setIsInfoOpen] = useState(false);

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
    <>
      {/* Info Icon Button */}
      <button
        onClick={() => setIsInfoOpen(open => !open)}
        style={{
          position: 'fixed',
          top: '50%',
          right: isInfoOpen ? '310px' : '10px',
          transform: 'translateY(-50%)',
          zIndex: 1001,
          background: '#007bff',
          border: 'none',
          color: 'white',
          borderRadius: '50%',
          width: '30px',
          height: '30px',
          fontWeight: 'bold',
          cursor: 'pointer',
        }}
        aria-label="Toggle info panel"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="white"
          viewBox="0 0 16 16"
          style={{ display: 'block', margin: 'auto' }}>
          <path d="M8 16A8 8 0 108 0a8 8 0 000 16zM7.002 4a1 1 0 112 0 1 1 0 01-2 0zm.1 2.995h1.797v5.905H7.102V6.995z" />
        </svg>
      </button>

      {/* Main Grid Layout */}
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
          <label style={{ fontSize: '10px' }}>
            <input
              type="checkbox"
              checked={leftMode === 'incoming'}
              onChange={() =>
                setLeftMode(prev => (prev === 'outgoing' ? 'incoming' : 'outgoing'))
              }
            /> Show Incoming
          </label>

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
        <div style={{ width: '2px', backgroundColor: '#ccc', height: '100%' }} />

        {/* Right Matrix */}
        <div style={{ overflow: 'auto', maxHeight: '100%', display: 'flex', flexDirection: 'column' }}>
          <h4>Genre Influence Matrix (Right)</h4>
          <label style={{ fontSize: '10px' }}>
            <input
              type="checkbox"
              checked={rightMode === 'incoming'}
              onChange={() =>
                setRightMode(prev => (prev === 'outgoing' ? 'incoming' : 'outgoing'))
              }
            /> Show Incoming
          </label>

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

      {/* Sliding Info Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: isInfoOpen ? 0 : '-320px',
          width: '300px',
          height: '100vh',
          backgroundColor: '#f9f9f9',
          boxShadow: '-2px 0 5px rgba(0,0,0,0.3)',
          padding: '8px',
          overflowY: 'auto',
          transition: 'right 0.3s ease-in-out',
          zIndex: 1000,
        }}
      >
        <h4 style={{ fontSize: '11px', fontWeight: 'bold' }}>Matrix Info:</h4>
        <p style={{ fontSize: '10px' }}>
          The matrices show the number of influences each genre has taken from or given to other genres over
          the selected year range. <br></br><br></br> The direction of the influence is determined by the selected mode (outgoing/incoming).
          <br></br><br></br>Genre labels are clickable, and clicking on a genre will highlight it, click once more to exit the toggle. <br></br>Boldfaced 
          italic genres are tied to Sailor Shift.
        </p>
      </div>
    </>
  );
}
