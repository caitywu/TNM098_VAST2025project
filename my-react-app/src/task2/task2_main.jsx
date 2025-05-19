// main task 2
import React, { useEffect, useState } from 'react';
import { loadGraphData } from './dataLoader';
import {
  computeGenreMetrics,
  computeOceanusFolkInfluences,
  getSailorShiftGenres,
  computeGenreYearlyTotals
} from './GenreMetrics';
import ParallelPlot from './ParallelPlot';
import OceanusFolkInfluenceBarChart from './BarChart';
import ReactSlider from 'react-slider';
import NotableArtistNetworkGraph from './NotableArtistNetwork';
import StackedHistogram from './Historgram';
import InfluenceTypeStackedHistogram from './InfluenceTypeHistogram';
import { computeOceanusFolkInfluenceTypeCounts } from './InfluenceTypeHistogram';
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
  const [yearlyGenreTotals, setYearlyGenreTotals] = useState(null);
  
  const [influenceTypeData, setInfluenceTypeData] = useState(null);
  const [minNotables, setMinNotables] = useState(0);

  const [selectedInfluenceTypes, setSelectedInfluenceTypes] = useState(new Set([
    "InStyleOf",
    "DirectlySamples",
    "CoverOf",
    "LyricalReferenceTo"
  ]));

  const yearRange = [selectedYear, selectedYear];

  // effect to load graph data
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

        const totals = computeGenreYearlyTotals(graph.nodes, [minYear, maxYear]);
        setYearlyGenreTotals(totals);

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

  // effect to compute genre metrics and influence data
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

  // effect to compute influence type data 
  useEffect(() => {
  if (!data) return;

  const counts = computeOceanusFolkInfluenceTypeCounts(
    data.nodes,
    data.links,
    selectedInfluenceTypes,
    minMaxYear 
  );
  setInfluenceTypeData(counts);
}, [data, selectedInfluenceTypes, minMaxYear]);

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
        gridTemplateColumns: '2fr 1fr 2fr',
        gridTemplateRows: '1fr 1fr',
        gap: '3px',
        padding: '10px',
        height: '86vh',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >

      {/* Top Left: Network */}
      <div style={{ gridColumn: '1 / 3', gridRow: '1', padding: '5px', borderRadius: '1px', overflow: 'auto' }}>
        <h4>Network</h4>
        <div style={{ marginBottom: '5px', fontSize: '8px' }}>
          {["InStyleOf", "DirectlySamples", "CoverOf", "LyricalReferenceTo"].map(type => (
            <label key={type} style={{ marginRight: '1px' }}>
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
        {/* Vertical Slider next to Network */}
<div style={{
  position: 'absolute',
  top: '80px',
  left: 'calc(66.5% - 30px)', // adjust this to fine-tune placement
  height: '300px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
}}>
  <label style={{ fontSize: '10px', writingMode: 'vertical-rl', marginBottom: '8px' }}>
    Min Notables: {minNotables}
  </label>
  <ReactSlider
    className="custom-slider-vertical"
    thumbClassName="custom-thumb"
    trackClassName="custom-track"
    orientation="vertical"
    min={0}
    max={50}
    value={minNotables}
    onChange={setMinNotables}
    style={{ height: '100%', width: '60px' }}
  />
</div>
        {data && (
          <NotableArtistNetworkGraph
            nodes={data.nodes}
            links={data.links}
            yearRange={yearRange}
            selectedInfluenceTypes={selectedInfluenceTypes}
            minNotables={minNotables}
          />
        )}
      </div>

      {/* Top Right: Info Box */}
      <div style={{ gridColumn: '3', gridRow: '1', padding: '1px', borderRadius: '2px', overflowY: 'auto' }}>
          <h4>Oceanus Folk Outgoing Influences</h4>
          <InfluenceTypeStackedHistogram data={influenceTypeData} width={200} height={270} yearRange={[1975, 2040]} />
      </div>

      {/* Bottom Left: Histogram */}
      <div style={{ gridColumn: '1', gridRow: '2', padding: '10px', borderRadius: '8px', maxWidth: '1000px' }}>
  <h4>Stacked Histogram</h4>
  {yearlyGenreTotals ? (
          <StackedHistogram
            data={yearlyGenreTotals}
            width={950} height={170}
           highlightedGenre={highlightedGenre}/>
  ) : (
    <p>Loading histogram data...</p>
  )}
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
          <h4>Top influenced Artists of all time</h4>
          {/* <OceanusFolkInfluenceBarChart data={influenceData} /> */}
          <h4> # of activites in the genre historgram are aggregated values of:  </h4>
          {/* <p></p> */}
          <ul style={{ listStyleType: 'none', paddingLeft: 0, fontSize: '11px' }}>
            <li># of songs</li>
            <li># of albums</li>
            <li># of record labels</li>
            <li># of artists + groups</li>
            <li># of notables</li>
            <li># of lyricists + composers</li>
          </ul>
        </div> 

        
        {/* <div style={{ flex: 1, padding: '10px', borderRadius: '8px' }}>
          <h4>Oceanus Folk Over Time</h4>
        </div> */}
      </div>


      {/* Year Slider */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '33.5%',
        transform: 'translateX(-47%)',
        width: '65%',
        padding: '10px',
      }}>
        {/* Scented widget for time slider*/}
        <ReactSlider
          className="custom-slider"
          thumbClassName="custom-thumb"
          trackClassName="custom-track"
          min={minMaxYear[0]}
          max={minMaxYear[1]}
          value={selectedYear}
          onChange={setSelectedYear}
        />
        <div style={{
  color: '#000',
  fontWeight: 'bold',
  textAlign: 'center',
  transform: 'translateY(20px)',
}}>
  Year: {selectedYear}
</div>
      </div>
    </div>
  );
}