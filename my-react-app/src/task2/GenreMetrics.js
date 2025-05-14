
// export function computeGenreMetrics(nodes, links) {
//   const genreStats = {};

//   // Normalize "Node Type" to nodeType
//   const normalizedNodes = nodes.map(node => ({
//     ...node,
//     nodeType: node.nodeType || node["Node Type"] || null,
//   }));

//   normalizedNodes.forEach(node => {
//     if (!node.genre) return;

//     const genre = node.genre;
//     if (!genreStats[genre]) {
//       genreStats[genre] = {
//         genre,
//         songs: 0,
//         albums: 0,
//         recordLabels: new Set(),
//         artists: new Set(),
//         notables: 0,
//         lyricists: new Set(),
//         composers: new Set(),
//       };
//     }

//     const g = genreStats[genre];

//     if (node.nodeType === "Song") g.songs++;
//     if (node.nodeType === "Album") g.albums++;
//     if (node.notable) g.notables++;
//   });

//   links.forEach(link => {
//     const target = normalizedNodes.find(n => n.id === link.target);
//     const source = normalizedNodes.find(n => n.id === link.source);
//     if (!target || !target.genre) return;

//     const genre = target.genre;
//     const g = genreStats[genre];

//     if (["RecordedBy", "DistributedBy"].includes(link.edgeType)) {
//       g.recordLabels.add(link.source);
//     }

//     if (["PerformerOf", "MemberOf"].includes(link.edgeType)) {
//       g.artists.add(link.source);
//     }

//     if (link.edgeType === "LyricistOf") {
//       g.lyricists.add(link.source);
//     }

//     if (link.edgeType === "ComposerOf") {
//       g.composers.add(link.source);
//     }
//   });

//   return Object.values(genreStats).map(g => ({
//     genre: g.genre,
//     songs: g.songs,
//     albums: g.albums,
//     recordLabels: g.recordLabels.size,
//     artists: g.artists.size,
//     notables: g.notables,
//     lyricistsAndComposers: g.lyricists.size + g.composers.size,
//   }));
// }


// Helper function to normalize edge types
// function normalizeEdgeType(edgeType) {
//   if (!edgeType) return null;

//   return edgeType
//     .toLowerCase()
//     .replace(/ /g, ''); // Remove spaces and standardize the casing
// }

export function computeGenreMetrics(nodes, links) {
  const genreStats = {};

  // Normalize "Node Type" to nodeType
  const normalizedNodes = nodes.map(node => ({
    ...node,
    nodeType: node.nodeType || node["Node Type"] || null,
  }));

  // Normalize edge types
  const normalizedLinks = links.map(link => ({
    ...link,
    edgeType: link.edgeType || link["Edge Type"] || null, // Normalize edge type here
  }));

  normalizedNodes.forEach(node => {
    if (!node.genre) return;

    const genre = node.genre;
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

    if (node.nodeType === "Song") g.songs++;
    if (node.nodeType === "Album") g.albums++;
    if (node.notable) g.notables++;
  });

  normalizedLinks.forEach(link => {
    const target = normalizedNodes.find(n => n.id === link.target);
    const source = normalizedNodes.find(n => n.id === link.source);
    if (!target || !target.genre) return;

    const genre = target.genre;
    const g = genreStats[genre];

    // Now handle the normalized edge types
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


  // Return the genre metrics as an array of objects, with updated counts
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
