// Function to compute genre counts 
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

  // Return the respective genre counts 
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


// Function to compute yearly genre totals
export function computeGenreYearlyTotals(nodes, yearRange = [0, Infinity]) {
  const [minYear, maxYear] = yearRange;
  const yearlyGenreData = {};

  const normalizedNodes = nodes.map(n => ({
    ...n,
    nodeType: n.nodeType || n["Node Type"] || null,
    release_date: parseInt(n.release_date),
    genre: n.genre || null,
  }));

  for (const node of normalizedNodes) {
    const { release_date, genre, nodeType } = node;
    if (!genre || isNaN(release_date) || release_date < minYear || release_date > maxYear) continue;

    if (!yearlyGenreData[release_date]) yearlyGenreData[release_date] = {};
    if (!yearlyGenreData[release_date][genre]) {
      yearlyGenreData[release_date][genre] = {
        songs: 0,
        albums: 0,
        notables: 0,
        lyricistsAndComposers: 0,
        artistsAndGroups: 0,
        recordLabels: 0,
      };
    }

    const genreData = yearlyGenreData[release_date][genre];
    if (nodeType === "Song") genreData.songs++;
    else if (nodeType === "Album") genreData.albums++;
  }

  return yearlyGenreData;
}



// Function to compute Oceanus Folk influences
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





export function getSailorShiftGenres(nodes, links) {
  const normalizedNodes = nodes.map(n => ({
    ...n,
    name: n.name || "",
    nodeType: n.nodeType || n["Node Type"],
    genre: n.genre || null,
    release_date: parseInt(n.release_date),
  }));

  const nodeById = new Map(normalizedNodes.map(n => [n.id, n]));

  const normalizedLinks = links.map(link => ({
    ...link,
    edgeType: link.edgeType || link["Edge Type"],
  }));

  const targetGenres = new Set();
  const relevantTypes = new Set(["PerformerOf", "ProducerOf", "LyricistOf", "ComposerOf"]);

  normalizedLinks.forEach(link => {
    if (!relevantTypes.has(link.edgeType)) return;

    const targetNode = nodeById.get(link.target);
    if (!targetNode || !targetNode.genre) return;

    // Normalize source name (handle both ID or full object)
    let sourceName = "";

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










