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

  // First pass: process all nodes (songs & albums)
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

  // Second pass: process all links
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








export function computeOceanusFolkInfluences(nodes, links, yearRange) {
  const [minYear, maxYear] = yearRange;

  // Normalize nodes with parsed years and genre
  const normalizedNodes = nodes.map(n => ({
    ...n,
    release_date: parseInt(n.release_date),
    genre: n.genre || null,
  }));

  // Map for quick node lookup
  const nodeById = new Map(normalizedNodes.map(n => [n.id, n]));

  // Normalize links with edgeType normalized
  const normalizedLinks = links.map(link => ({
    ...link,
    edgeType: link.edgeType || link["Edge Type"] || null,
  }));

  const relevantTypes = ["DirectlySamples", "CoverOf", "StyleOf", "LyricalReferenceTo"];
  const result = {
    DirectlySamples: 0,
    CoverOf: 0,
    StyleOf: 0,
    LyricalReferenceTo: 0,
  };

  normalizedLinks.forEach(link => {
    if (!relevantTypes.includes(link.edgeType)) return;

    const sourceNode = nodeById.get(link.source);
    const targetNode = nodeById.get(link.target);
    if (!sourceNode || sourceNode.genre !== "Oceanus Folk") return;
    if (!targetNode) return;

    const year = targetNode.release_date;
    if (isNaN(year) || year < minYear || year > maxYear) return;

    result[link.edgeType]++;
  });

  return result;
}






export function getSailorShiftGenres(nodes, links, yearRange = [0, Infinity]) {
  const [minYear, maxYear] = yearRange;
  const normalizedNodes = nodes.map(n => ({
    ...n,
    nodeType: n.nodeType || n["Node Type"],
    release_date: parseInt(n.release_date),
    genre: n.genre || null,
  }));

  const nodeById = new Map(normalizedNodes.map(n => [n.id, n]));

  const normalizedLinks = links.map(link => ({
    ...link,
    edgeType: link.edgeType || link["Edge Type"],
  }));

  const targetGenres = new Set();
  const relevantTypes = ["PerformerOf", "ProducerOf", "LyricistOf", "ComposerOf"];

  normalizedLinks.forEach(link => {
    if (!relevantTypes.includes(link.edgeType)) return;

    const target = nodeById.get(link.target);
    if (!target || !target.genre) return;

    const year = target.release_date;
    if (isNaN(year) || year < minYear || year > maxYear) return;

    // Check if source is Sailor Shift
    if (typeof link.source === "string" && link.source.toLowerCase().includes("sailor shift")) {
      targetGenres.add(target.genre);
    }

    const sourceNode = nodeById.get(link.source);
    if (sourceNode && sourceNode.name && sourceNode.name.toLowerCase().includes("sailor shift")) {
      targetGenres.add(target.genre);
    }
  });

  return Array.from(targetGenres);
}








export function computeGenreInfluenceMatrix(nodes, links, yearRange = [0, Infinity], reverse = false) {
  const [minYear, maxYear] = yearRange;

  // Normalize nodes
  const normalizedNodes = nodes.map(n => ({
    ...n,
    release_date: parseInt(n.release_date),
    genre: n.genre || null,
  }));

  // Map nodes by ID
  const nodeById = new Map(normalizedNodes.map(n => [n.id, n]));

  // Normalize links
  const normalizedLinks = links.map(link => ({
    ...link,
    edgeType: link.edgeType || link["Edge Type"] || null,
  }));

  // Get unique genres
  const genres = Array.from(new Set(normalizedNodes.map(n => n.genre).filter(g => g)));

  // Initialize matrix with zeros
  const matrix = {};
  genres.forEach(g1 => {
    matrix[g1] = {};
    genres.forEach(g2 => {
      matrix[g1][g2] = 0;
    });
  });

  // Define relevant influence edge types
  const influenceEdges = ["DirectlySamples", "CoverOf", "StyleOf", "LyricalReferenceTo"];

  normalizedLinks.forEach(link => {
    if (!influenceEdges.includes(link.edgeType)) return;

    const sourceNode = nodeById.get(link.source);
    const targetNode = nodeById.get(link.target);

    if (!sourceNode || !targetNode) return;
    if (isNaN(sourceNode.release_date) || isNaN(targetNode.release_date)) return;
    if (sourceNode.release_date < minYear || sourceNode.release_date > maxYear) return;
    if (targetNode.release_date < minYear || targetNode.release_date > maxYear) return;

    const sourceGenre = sourceNode.genre;
    const targetGenre = targetNode.genre;

    if (!sourceGenre || !targetGenre) return;

    if (reverse) {
      // Count influence from targetGenre to sourceGenre
      matrix[targetGenre][sourceGenre]++;
    } else {
      // Count influence from sourceGenre to targetGenre
      matrix[sourceGenre][targetGenre]++;
    }
  });

  return { matrix, genres };
}
