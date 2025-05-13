export function computeGenreMetrics(nodes, links) {
  const genreStats = {};

  nodes.forEach(node => {
    if (!node.genre) return;

    const genre = node.genre;
    if (!genreStats[genre]) {
      genreStats[genre] = {
        genre,
        songs: 0,
        albums: 0,
        recordLabels: new Set(),
        artists: new Set(),
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

  links.forEach(link => {
    const target = nodes.find(n => n.id === link.target);
    const source = nodes.find(n => n.id === link.source);
    if (!target || !target.genre) return;

    const genre = target.genre;
    const g = genreStats[genre];

    if (["RecordedBy", "DistributedBy"].includes(link.edgeType)) {
      g.recordLabels.add(link.source);
    }

    if (["PerformerOf", "MemberOf"].includes(link.edgeType)) {
      g.artists.add(link.source);
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
    recordLabels: g.recordLabels.size,
    artists: g.artists.size,
    notables: g.notables,
    lyricistsAndComposers: g.lyricists.size + g.composers.size,
  }));
}
