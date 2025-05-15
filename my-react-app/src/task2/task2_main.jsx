import React, { useEffect, useState } from 'react';
import { loadGraphData } from './dataLoader';
import { computeGenreMetrics, computeOceanusFolkInfluences } from './GenreMetrics';
import ParallelPlot from './ParallelPlot';
import OceanusFolkInfluenceBarChart from './BarChart';


// import TimeSeriesChart from '../TimeSeriesChart';
// import InfluenceTimeline from './influenceTimeline';

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
  const [influenceData, setInfluenceData] = useState(null);

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

      setGenreStats(computeGenreMetrics(graph.nodes, graph.links, [minYear, maxYear]));
      setInfluenceData(computeOceanusFolkInfluences(graph.nodes, graph.links, [minYear, maxYear]));
    });
  }, []);

  useEffect(() => {
    if (!data) return;
    setGenreStats(computeGenreMetrics(data.nodes, data.links, yearRange));
    setInfluenceData(computeOceanusFolkInfluences(data.nodes, data.links, yearRange));
  }, [yearRange, data]);

  const genreList = genreStats.map(g => g.genre).sort();

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: '2fr 1fr 1fr', 
      gridTemplateRows: '1fr 1fr', 
      gap: '8x', 
      padding: '20px', 
      height: '100vh', 
      boxSizing: 'border-box',
      position: 'relative' 
    }}>
      {/* Top Left: Network Graph (Placeholder) */}
      <div style={{ gridColumn: '1 / 3', gridRow: '1', padding: '10px', borderRadius: '8px' }}>
        <h2>Network Graph</h2>
        {/* Add your force graph component here */}
      </div>

      {/* Top Right: Info Box */}
      <div style={{ gridColumn: '3', gridRow: '1', padding: '10px', borderRadius: '8px', overflowY: 'auto' }}>
        <h2>Info Box</h2>
        {/* Add selected node/edge details here */}
      </div>

      {/* Bottom Left: Parallel Plot */}
      <div style={{ gridColumn: '1', gridRow: '2', padding: '3px', borderRadius: '8px', maxWidth: '1300px' }}>
        <h2>Parallel Plot</h2>
        <ParallelPlot data={genreStats} highlightedGenre={highlightedGenre} />
      </div>

      {/* Bottom Middle: Genre List */}
      <div style={{ 
        gridColumn: '2', 
        gridRow: '2', 
        padding: '10px', 
        backgroundColor: '#f9f9f9', 
        borderRadius: '8px', 
        overflowY: 'auto',  
        maxWidth: '280px',  
        justifySelf: 'end' 
      }}>
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
              onClick={() =>
                setHighlightedGenre(prev => (prev === genre ? null : genre))
              }
            >
              {genre}
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom Right: Two stacked charts */}
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
          {/* Time series chart placeholder replaced with actual chart */}
          {/* <TimeSeriesChart nodes={data?.nodes || []} /> */}
            
        </div>
      </div>

      {/* Time Slider */}
      <div style={{
        position: 'absolute',
        bottom: '2px',
        left: '50%',
        transform: 'translateX(-80%)',
        padding: '10px 10px',
        borderRadius: '8px',
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
