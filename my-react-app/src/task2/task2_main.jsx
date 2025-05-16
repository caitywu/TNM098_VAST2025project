// Imports remain the same...
import React, { useEffect, useState } from 'react';
import { loadGraphData } from './dataLoader';
import {
  computeGenreMetrics,
  computeOceanusFolkInfluences,
  getSailorShiftGenres,
} from './GenreMetrics';
import ParallelPlot from './ParallelPlot';
import OceanusFolkInfluenceBarChart from './BarChart';
import ReactSlider from 'react-slider';
import NotableArtistNetworkGraph from './NotableArtistNetwork';
import './CustomSlider.css';

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

  const [selectedInfluenceTypes, setSelectedInfluenceTypes] = useState(new Set([
    "InStyleOf",
    "DirectlySamples",
    "CoverOf",
    "LyricalReferenceTo"
  ]));

  const yearRange = [selectedYear, selectedYear];

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

  useEffect(() => {
    if (!data) return;

    const allStats = computeGenreMetrics(data.nodes, data.links, yearRange);

    if (showSailorShiftGenres) {
      const sailorGenres = getSailorShiftGenres(data.nodes, data.links, yearRange);
      setGenreStats(allStats.filter(stat => sailorGenres.includes(stat.genre)));
    } else {
      setGenreStats(allStats);
    }

    setInfluenceData(computeOceanusFolkInfluences(data.nodes, data.links, yearRange));
  }, [selectedYear, data, showSailorShiftGenres]);

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
      {/* Top Left: Network */}
      <div style={{ gridColumn: '1 / 3', gridRow: '1', padding: '10px', borderRadius: '8px', overflow: 'auto' }}>
        <h2>Network</h2>
        <div style={{ marginBottom: '10px' }}>
          {["InStyleOf", "DirectlySamples", "CoverOf", "LyricalReferenceTo"].map(type => (
            <label key={type} style={{ marginRight: '15px' }}>
              <input
                type="checkbox"
                checked={selectedInfluenceTypes.has(type)}
                onChange={() =>
                  setSelectedInfluenceTypes(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(type)) {
                      newSet.delete(type);
                    } else {
                      newSet.add(type);
                    }
                    return newSet;
                  })
                }
              />
              {type}
            </label>
          ))}
        </div>
        {data && (
          <NotableArtistNetworkGraph
            nodes={data.nodes}
            links={data.links}
            yearRange={yearRange}
            selectedInfluenceTypes={selectedInfluenceTypes}
          />
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
      <div style={{
        gridColumn: '2',
        gridRow: '2',
        padding: '10px',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        overflowY: 'auto',
        maxWidth: '280px',
        justifySelf: 'end',
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
          <h4>Oceanus Folk Outgoing Influence Types</h4>
          <OceanusFolkInfluenceBarChart data={influenceData} />
        </div>
        <div style={{ flex: 1, padding: '10px', borderRadius: '8px' }}>
          <h4>Oceanus Folk Over Time</h4>
        </div>
      </div>

      {/* Year Slider */}
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
