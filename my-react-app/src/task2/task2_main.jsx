import React, { useEffect, useState, useMemo } from 'react';

import { loadGraphData } from './dataLoader';
import {
  computeGenreMetrics,
  computeOceanusFolkInfluences,
  computeGenreYearlyTotals,
  computeMostInfluencedFromOceanusFolk
} from './GenreMetrics';
import NotableArtistNetworkGraph from './NotableArtistNetwork';
import StackedHistogram from './Historgram';
import InfluenceTypeStackedHistogram from './InfluenceTypeHistogram';
import { computeOceanusFolkInfluenceTypeCounts } from './InfluenceTypeHistogram';

import ReactSlider from 'react-slider';
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

export default function Task2Main() {
  const [data, setData] = useState(null); // state for graph data
  const [genreStats, setGenreStats] = useState([]); // state for genre stats on the stacked histogram
  const [highlightedGenre, setHighlightedGenre] = useState(null); // State for highlighting genres in stacked histogram

  const [selectedYear, setSelectedYear] = useState(2000); // State for year selection 
  const [selectedYearRange, setSelectedYearRange] = useState([2000, 2000]);
  const [minMaxYear, setMinMaxYear] = useState([2000, 2030]);

  const [influenceData, setInfluenceData] = useState(null);
  const [globalDomain, setGlobalDomain] = useState(null);

  const [yearlyGenreTotals, setYearlyGenreTotals] = useState(null); // state to count stacked histogram genres 
  const [influenceTypeData, setInfluenceTypeData] = useState(null); // checkbox state for influence histogram + network
  const [minNotables, setMinNotables] = useState(0); // Network state for notables filtering

  const [topInfluencedArtists, setTopInfluencedArtists] = useState([]); // State for top five influenced artists/groupa

  // Influence types state
  const [selectedInfluenceTypes, setSelectedInfluenceTypes] = useState(new Set([
    "InStyleOf",
    "DirectlySamples",
    "CoverOf",
    "LyricalReferenceTo",
    "InterpolatesFrom",
  ]));

  // State for info panel
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  // Get the year range from the dataset 
  const yearRange = selectedYearRange;

  useEffect(() => {
    // Load graph data from file
    loadGraphData('/MC1_graph.json').then(graph => {
      setData(graph);
      
      // Find min and max years from release dates in data
      const years = graph.nodes
        .filter(n => n.nodeType === "Song" || n["Node Type"] === "Song")
        .map(n => parseInt(n.release_date))
        .filter(y => !isNaN(y));

      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);
      
      // Initialize startup year range
      const desiredStart = 1995;
      const desiredEnd = 2005;
      const start = Math.max(minYear, desiredStart);
      const end = Math.min(maxYear, desiredEnd);

      setMinMaxYear([minYear, maxYear]);
      setSelectedYearRange([start, end]);

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

  useEffect(() => {
    if (!data) return;
    // Compute genre metrics for the selected year range
    const allStats = computeGenreMetrics(data.nodes, data.links, yearRange);

    setGenreStats(allStats);
    
    // Compute the influence type histogram
    setInfluenceData(computeOceanusFolkInfluences(data.nodes, data.links, yearRange));
  }, [selectedYearRange, data]);

  // Compute yearly influence type counts
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

  // Show genre stats
  const dynamicDomain = useMemo(() => {
    if (!genreStats || genreStats.length === 0) return null;

    const domain = {};
    for (const dim of dimensions) {
      const values = genreStats.map(d => d[dim]);
      domain[dim] = [Math.min(...values), Math.max(...values)];
    }
    return domain;
  }, [genreStats]);

  useEffect(() => {
    if (!data) return;
    const topArtists = computeMostInfluencedFromOceanusFolk(
    data.nodes,
    data.links,
    selectedInfluenceTypes);
    setTopInfluencedArtists(topArtists);
  }, [data, selectedInfluenceTypes]);

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
        <div style={{ gridColumn: '1 / 3', gridRow: '1', padding: '1px', overflow: 'auto' }}>
          <h4 style={{ fontSize: '11px', fontWeight: 'bold' }}>Network</h4>
          <div style={{ marginBottom: '5px', fontSize: '8px' }}>
            {["InStyleOf", "DirectlySamples", "CoverOf", "LyricalReferenceTo", "InterpolatesFrom"].map(type => (
              <label key={type} style={{ marginRight: '1px' }}>
                <input
                  type="checkbox"
                  checked={selectedInfluenceTypes.has(type)}
                  onChange={() =>
                    setSelectedInfluenceTypes(prev => {
                      const newSet = new Set(prev);
                      newSet.has(type) ? newSet.delete(type) : newSet.add(type);
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
              max={100}
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

        {/* Top Right: Influence type histogram */}
        <div style={{ gridColumn: '3', gridRow: '1', padding: '1px', overflowY: 'visible' }}>
          <h4 style={{ fontSize: '11px', fontWeight: 'bold' }}>Outgoing Oceanus Folk</h4>
          <InfluenceTypeStackedHistogram
            data={influenceTypeData}
            width={200}
            height={270}
            yearRange={[1975, 2040]}
          />
        </div>

        {/* Bottom Left: Histogram */}
        <div style={{ gridColumn: '1', gridRow: '2', padding: '10px' }}>
          <h4 style={{ fontSize: '11px', fontWeight: 'bold' }}>Stacked Histogram</h4>
          {yearlyGenreTotals ? (
            <StackedHistogram
              data={yearlyGenreTotals}
              width={950}
              height={170}
              highlightedGenre={highlightedGenre}
            />
          ) : (
            <p>Loading histogram data...</p>
          )}
        </div>

        {/* Bottom center: Genre List */}
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
          <h4 style={{ fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}>Genre List</h4>
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

         {/* Bottom right: Genre Info */}
      {/* <div style={{ gridColumn: '3', gridRow: '2', padding: '1px', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>
        <h4 style={{ fontSize: '11px', fontWeight: 'bold' }}>Most Influenced By Oceanus Folk Of All Time</h4>
          <ul style={{ listStyleType: 'none', paddingLeft: 0, fontSize: '11px' }}>
            {topInfluencedArtists.map(([name, count], idx) => (
            <li key={idx} style={{ marginBottom: '4px' }}>
              <strong>{name}</strong>: {count} influences
            </li>
          ))}
          </ul>
      </div> */}

        {/* Bottom: Bottom Time Slider */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '33.5%',
          transform: 'translateX(-46%)',
          width: '70%',
          padding: '10px',
        }}>
          <ReactSlider
            className="custom-slider"
            thumbClassName="custom-thumb"
            trackClassName="custom-track"
            min={minMaxYear[0]}
            max={minMaxYear[1]}
            value={selectedYearRange}
            onChange={setSelectedYearRange}
            pearling
            minDistance={0}
          />
               
          <div style={{
            color: '#000',
            fontWeight: 'bold',
            textAlign: 'center',
            transform: 'translateY(20px)',
            fontSize: '11px',
          }}>
            Range: {selectedYearRange[0]} – {selectedYearRange[1]}
          </div>
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
        <h4 style={{ fontSize: '11px', fontWeight: 'bold' }}>Network Info: </h4>
        <p style={{ fontSize: 10 }}>
          The network shows outgoing influences from Oceanus Folk to other genres - <b>i.e the source node of all
          influence edges are influenced, and all target nodes are influencers.</b> <br></br>Filtering on number
          of notables affects only non-oceanus folk Artists or Music groups and their work. <br></br><br></br> The
          clickable list to the left shows all artists/music groups in the current network selection.
        </p>

     

        <h4 style={{ fontSize: '11px', fontWeight: 'bold' }}>Influence Type Histogram Info: </h4>
        <p style={{ fontSize: 10 }}>
          The influence type histogram shows outgoing influences from oceanus folk, including influences within
          the oceanus folk genre. The counts can be filtered on influence type from the checkboxes above the network.
          <br></br> The career-defining years of Sailor Shift are boldfaced.
        </p>

   

        <h4 style={{ fontSize: '11px', fontWeight: 'bold' }}>Bottom Stacked Histogram Info:</h4>
        <p style={{ fontSize: 10 }}># of activities is the aggregated values of the following</p>
        <ul style={{ listStyleType: 'none', paddingLeft: 0, fontSize: '11px' }}>
          <li>- songs</li>
          <li>- albums</li>
          <li>- record labels</li>
          <li>- artists + groups</li>
          <li>- notables</li>
          <li>- lyricists + composers</li>
        </ul>

   

        <h4 style={{ fontSize: '11px', fontWeight: 'bold' }}>Lists Info:</h4>
        <p style={{ fontSize: 10 }}>The Genre list shows what genres had at least one release within
          the chosen year selection. Clicking a genre in the list will highlihgt it in the stacked bottom bar chart.<br></br><br></br>
          The Most Influenced Of All Time List shows the top 5 most influenced from Oceanus Folk
          artists/music groups. List can be filered by influence type.</p>
        
         

        <h4 style={{ fontSize: '11px', fontWeight: 'bold' }}>Time Slider Info:</h4>
        <p style={{ fontSize: 10 }}> 
          Use the time slider to filter the network and the genre list based on source node songs/album
          release dates. 
        </p>
      </div>
    </>
  );
}