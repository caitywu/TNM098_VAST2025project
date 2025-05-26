/**
 * Computes the counts of activities per genre in the dataset --> used by the stacked stats histogram.
 * 
 * @param {array} nodes - Nodes from the dataset.
 * @param {array} links - Edges from the dataset.
 * @param {array} yearRange - Array containing  minimum and maximum year for filtering nodes.
 * @returns {array} An array of objects containing the respective genre counts.
 */
export function computeGenreMetrics(nodes, links, yearRange = [0, Infinity]) {
  const genreStats = {};
  const [minYear, maxYear] = yearRange;

  const normalizedNodes = nodes.map(node => ({
    ...node,
    nodeType: node.nodeType || node["Node Type"] || null,
    release_date: parseInt(node.release_date),
  }));

  const nodeById = new Map(normalizedNodes.map(n => [n.id, n]));

  const normalizedLinks = links.map(link => ({
    ...link,
    edgeType: link.edgeType || link["Edge Type"] || null,
  }));

  // First pass: process all nodes (songs & albums) --> faster processing
  normalizedNodes.forEach(node => {
    const { genre, nodeType, release_date, notable } = node;
    if (!genre || isNaN(release_date) || release_date < minYear || release_date > maxYear) return;

    // Activities 
    if (!genreStats[genre]) {
      genreStats[genre] = {
        genre,
        songs: 0,
        albums: 0,
        recordLabels: new Set(),
        artistsAndGroups: new Set(),
        notables: 0,
        lyricists: new Set(),
        composers: new Set(),
      };
    }

    // Increment the respective counts on current node's genre
    const g = genreStats[genre];

    if (nodeType === "Song") {
      g.songs++;
      if (notable) g.notables++;
    } else if (nodeType === "Album") {
      g.albums++;
    }
  });

  // Second pass: process all links --> go through all edges to find nodes
  normalizedLinks.forEach(link => {
    const target = nodeById.get(link.target);
    if (!target || !target.genre) return;

    const { genre, release_date } = target;
    if (isNaN(release_date) || release_date < minYear || release_date > maxYear) return;

    const g = genreStats[genre];
    if (!g) return;

    // Add the source node to the respective sets based on edge type
    if (["RecordedBy", "DistributedBy"].includes(link.edgeType)) {
      g.recordLabels.add(link.source);
    }

    if (["PerformerOf", "MemberOf"].includes(link.edgeType)) {
      g.artistsAndGroups.add(link.source);
    }

    if (link.edgeType === "LyricistOf") {
      g.lyricists.add(link.source);
    }

    if (link.edgeType === "ComposerOf") {
      g.composers.add(link.source);
    }
  });

  // Return the respective counts 
  return Object.values(genreStats).map(g => ({
    genre: g.genre,
    songs: g.songs,
    albums: g.albums,
    notables: g.notables,
    recordLabels: g.recordLabels.size,
    artistsAndGroups: g.artistsAndGroups.size,
    lyricistsAndComposers: g.lyricists.size + g.composers.size,
  }));
}




/**
 * Computes the yearly totals of genre metrics by release year --> used by the stacked stats histogram.
 *
 * @param {array} nodes - Nodes from the dataset.
 * @param {array} yearRange - Array of thee minimum and maximum year for filtering nodes.
 * @returns {object} An object with keys=release years and values=respective genre metrics.
 */
export function computeGenreYearlyTotals(nodes, yearRange = [0, Infinity]) {
  const [minYear, maxYear] = yearRange;
  const yearlyGenreData = {};

  const normalizedNodes = nodes.map(n => ({
    ...n,
    nodeType: n.nodeType || n["Node Type"] || null,
    release_date: parseInt(n.release_date),
    genre: n.genre || null,
  }));

  // Iterate through each node and count the dimensions per genre
  for (const node of normalizedNodes) {
    const { release_date, genre, nodeType } = node;
    if (!genre || isNaN(release_date) || release_date < minYear || release_date > maxYear) continue;

    if (!yearlyGenreData[release_date]) yearlyGenreData[release_date] = {};
    if (!yearlyGenreData[release_date][genre]) {
      yearlyGenreData[release_date][genre] = {
        // Initialize dimension counts for each genre
        songs: 0,
        albums: 0,
        notables: 0,
        lyricistsAndComposers: 0,
        artistsAndGroups: 0,
        recordLabels: 0,
      };
    }

    // Increment the respective dimension counts
    const genreData = yearlyGenreData[release_date][genre];
    if (nodeType === "Song") genreData.songs++;
    else if (nodeType === "Album") genreData.albums++;
  }

  return yearlyGenreData;
}




/**
 * Computes the influence counts of different types originating from Oceanus Folk songs/albums.
 *
 * @param {Array} nodes - Nodes from the dataset.
 * @param {Array} links - Edges from the dataset.
 * @param {Array} yearRange - Array containing  minimum and maximum year for filtering nodes.
 * 
 * @returns {Object} An object containing the counts of each influence type where the source node 
 *                   is an Oceanus Folk song/album within the specified year range.
 */
export function computeOceanusFolkInfluences(nodes, links, yearRange) {
  const [minYear, maxYear] = yearRange;

  const normalizedNodes = nodes.map(n => ({
    ...n,
    release_date: parseInt(n.release_date),
    genre: n.genre || null,
  }));

  const nodeById = new Map(normalizedNodes.map(n => [n.id, n]));

  const normalizedLinks = links.map(link => ({
    ...link,
    edgeType: link.edgeType || link["Edge Type"] || null,
  }));

  // Define relevant edge types for Oceanus Folk influences
  const relevantEdgeTypes = ["DirectlySamples", "CoverOf", "StyleOf", "LyricalReferenceTo", "InterpolatesFrom"];

  // Identify Oceanus Folk sources in the year range
  const oceanusFolkSources = new Set(
    normalizedNodes
      .filter(n =>
        n.genre === "Oceanus Folk" &&
        !isNaN(n.release_date) &&
        n.release_date >= minYear &&
        n.release_date <= maxYear
      )
      .map(n => n.id)
  );

  // Tally influence types where source is Oceanus Folk
  const influenceCounts = {
  DirectlySamples: 0,
  CoverOf: 0,
  StyleOf: 0,
  LyricalReferenceTo: 0,
  InterpolatesFrom: 0
  }

  for (const link of normalizedLinks) {
    if (!relevantEdgeTypes.includes(link.edgeType)) continue;
    if (!oceanusFolkSources.has(link.source)) continue;

    const target = nodeById.get(link.target);
    if (!target) continue;

    const targetYear = target.release_date;
    if (isNaN(targetYear) || targetYear < minYear || targetYear > maxYear) continue;

    influenceCounts[link.edgeType]++;
  }

  return influenceCounts;
}





/**
 * Finds all unique genres Sailor Shift has performed, produced, lyriced, or composed.
 *
 * @param {Array} nodes - Nodes from dataset.
 * @param {Array} links - Edges from dataset.
 * @returns {Array} - An array of unique genres linked to "Sailor Shift"
 */
export function getSailorShiftGenres(nodes, links) {
  // Normalize nodes and links
  const normalizedNodes = nodes.map(n => ({
    ...n,
    name: n.name || "",
    nodeType: n.nodeType || n["Node Type"],
    genre: n.genre || null,
    release_date: parseInt(n.release_date),
  }));

  // Create a map of nodes by id
  const nodeById = new Map(normalizedNodes.map(n => [n.id, n]));

  const normalizedLinks = links.map(link => ({
    ...link,
    edgeType: link.edgeType || link["Edge Type"],
  }));
  // Find all links where the source is "Sailor Shift"
  const targetGenres = new Set();
  const relevantTypes = new Set(["PerformerOf", "ProducerOf", "LyricistOf", "ComposerOf"]);

  normalizedLinks.forEach(link => {
    if (!relevantTypes.has(link.edgeType)) return;

    const targetNode = nodeById.get(link.target);
    if (!targetNode || !targetNode.genre) return;

    // Normalize source name (handle both ID or full object)
    let sourceName = "";

    // Iterate over the source nodes to find if they are tied to Sailor Shift
    if (typeof link.source === "string") {
      const sourceNode = nodeById.get(link.source);
      if (sourceNode) sourceName = sourceNode.name || "";
    } else if (typeof link.source === "object") {
      sourceName = link.source.name || "";
    }

    if (sourceName.toLowerCase().includes("sailor shift")) {
      targetGenres.add(targetNode.genre);
    }
  });

  return Array.from(targetGenres);
}



/**
 * Computes the top 5 most influenced performers of Oceanus Folk.
 *
 * @param {Array} nodes - Nodes from the dataset.
 * @param {Array} links - Edges from the dataset.
 * @param {Set<string>} selectedInfluenceTypes - Set of valid influence type edges
 *
 * @returns {Array<[string, number]>} An array of tuples containing the top 5 influenced performer names and their respective counts.
 */
export function computeMostInfluencedFromOceanusFolk(nodes, links, selectedInfluenceTypes) {
  const getEdgeType = (link) => link.edgeType || link["Edge Type"];
  const getNodeType = (node) => node.nodeType || node["Node Type"];
  const nodeById = new Map(nodes.map(n => [n.id, n]));

  const oceanusFolkSongs = new Set(
    nodes.filter(n =>
      (n.genre === "Oceanus Folk") &&
      (getNodeType(n) === "Song" || getNodeType(n) === "Album")
    ).map(n => n.id)
  );

  // Map each song to its set of performers
  const songToPerformers = new Map();
  links.forEach(link => {
    if (getEdgeType(link) === "PerformerOf") {
      const performerId = link.source;
      const songId = link.target;
      if (!songToPerformers.has(songId)) {
        songToPerformers.set(songId, new Set());
      }
      songToPerformers.get(songId).add(performerId);
    }
  });

  const influenceCounts = new Map();

  // Count the number of influences for each performer
  links.forEach(link => {
    const edgeType = getEdgeType(link);
    if (!selectedInfluenceTypes.has(edgeType)) return;

    if (!oceanusFolkSongs.has(link.target)) return;

    const performers = songToPerformers.get(link.source);
    if (!performers) return;

    performers.forEach(performerId => {
      influenceCounts.set(performerId, (influenceCounts.get(performerId) || 0) + 1);
    });
  });

  // Sort and return the top 5 performers
  const result = [...influenceCounts.entries()]
    .map(([id, count]) => [nodeById.get(id)?.name || id, count])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return result;
}
