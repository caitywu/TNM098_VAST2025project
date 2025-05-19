// main task 2
import React, { useEffect, useState } from 'react';
import { loadGraphData } from './dataLoader';
import {
  computeGenreMetrics,
  computeOceanusFolkInfluences,
  getSailorShiftGenres,
  computeGenreYearlyTotals
} from './GenreMetrics';
import ReactSlider from 'react-slider';
import NotableArtistNetworkGraph from './NotableArtistNetwork';
import StackedHistogram from './Historgram';
import InfluenceTypeStackedHistogram from './InfluenceTypeHistogram';
import { computeOceanusFolkInfluenceTypeCounts } from './InfluenceTypeHistogram';
import './CustomSlider.css';

// Dimensions for genre histogram 
const dimensions = [
  'songs',
  'albums',
  'recordLabels',
  'notables',
  'lyricistsAndComposers',
  'artistsAndGroups',
];

// Function to determine genre color
function genreColor(genre) {
  if (genre === "Oceanus Folk") return "red";
  if (genre.toLowerCase().endsWith("rock")) return "#1f77b4";
  if (genre.toLowerCase().endsWith("folk")) return "#2ca02c";
  if (genre.toLowerCase().endsWith("metal")) return "#9467bd";
  if (genre.toLowerCase().endsWith("pop")) return "#ff7f0e";
  return "#000000";
}

// Main component
export default function Task2Main() {
  // State variables
  const [data, setData] = useState(null); // state for graph data
  const [genreStats, setGenreStats] = useState([]); // State for filtering genre stats
  const [highlightedGenre, setHighlightedGenre] = useState(null); // State for highlighting genres
  const [selectedYear, setSelectedYear] = useState(2000); // State for year selection
  const [minMaxYear, setMinMaxYear] = useState([2000, 2030]); // State for min and max year
  const [influenceData, setInfluenceData] = useState(null); // State for influence computations
  const [showSailorShiftGenres, setShowSailorShiftGenres] = useState(false); // State for showing sailor shift genres
  const [globalDomain, setGlobalDomain] = useState(null); // State for global time domain
  const [yearlyGenreTotals, setYearlyGenreTotals] = useState(null); // State for yearly genre totals
  const [influenceTypeData, setInfluenceTypeData] = useState(null); // State for influence types per year
  const [minNotables, setMinNotables] = useState(0); // State for filtering on # of notables
  // State selecting the year range based on the graph data on release date
  const [selectedInfluenceTypes, setSelectedInfluenceTypes] = useState(new Set([
    "InStyleOf",
    "DirectlySamples",
    "CoverOf",
    "LyricalReferenceTo", 
    "InterpolatesFrom",
  ]));

  const yearRange = [selectedYear, selectedYear];

  // Effect to load graph data
  useEffect(() => {
    loadGraphData('/MC1_graph.json').then(graph => {
      setData(graph);

      // Get year range from graph data on release date
      const years = graph.nodes
        .filter(n => n.nodeType === "Song" || n["Node Type"] === "Song")
        .map(n => parseInt(n.release_date))
        .filter(y => !isNaN(y));

      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);

      setMinMaxYear([minYear, maxYear]);
      setSelectedYear(minYear);

      // Geet all years to compute totals 
      const totals = computeGenreYearlyTotals(graph.nodes, [minYear, maxYear]);
      setYearlyGenreTotals(totals);

      // Compute counts for each genre for entire year range of the dataset
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

  // Effect to compute genre metrics and influence data
  useEffect(() => {
    if (!data) return;

    const allStats = computeGenreMetrics(data.nodes, data.links, yearRange);

    // Filter out genres to only those done by Sailor Shift
    if (showSailorShiftGenres) {
      const sailorGenres = getSailorShiftGenres(data.nodes, data.links, yearRange);
      setGenreStats(allStats.filter(stat => sailorGenres.includes(stat.genre)));
    } else {
      setGenreStats(allStats);
    }

    setInfluenceData(computeOceanusFolkInfluences(data.nodes, data.links, yearRange));
  }, [selectedYear, data, showSailorShiftGenres]);

  // Effect to compute influence type data 
  useEffect(() => {
  if (!data) return;
  
  // Compute count of influence types 
  const counts = computeOceanusFolkInfluenceTypeCounts(
    data.nodes,
    data.links,
    selectedInfluenceTypes,
    minMaxYear 
  );
  setInfluenceTypeData(counts);
}, [data, selectedInfluenceTypes, minMaxYear]);

  // Get a list of unique genres
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
          {["InStyleOf", "DirectlySamples", "CoverOf", "LyricalReferenceTo", "InterpolatesFrom"].map(type => (
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
          left: 'calc(66.5% - 30px)', 
          height: '300px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
        >
      
      {/* Label for notables filter slider */}
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
        {/* Create the network graph */}
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

      {/* Influence type histogram */}
      <div style={{ gridColumn: '3', gridRow: '1', padding: '1px', borderRadius: '2px', overflowY: 'auto' }}>
        <h4 style={{ padding: '0px' }}>Outgoing Oceanus Folk</h4>
        {/* <p style={{ fontSize: '8px', padding: '0px' }}>exluding oceanusFolk internals</p> */}
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

      {/* Scrollable Genre List */}
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

      {/* Info on genre histogram */}
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
            <li>songs</li>
            <li>albums</li>
            <li>record labels</li>
            <li>artists + groups</li>
            <li>notables</li>
            <li>lyricists + composers</li>
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
        transform: 'translateX(-46%)',
        width: '70%',
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