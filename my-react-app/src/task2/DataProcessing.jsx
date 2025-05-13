export function processGenreData({ nodes, links }, yearRange) {
  const genreMap = {};

  nodes.forEach(node => {
    if (node.genre && node.year >= yearRange[0] && node.year <= yearRange[1]) {
      const genre = node.genre;
      if (!genreMap[genre]) {
        genreMap[genre] = {
          genre,
          songCount: 0,
          albumCount: 0,
          labelSet: new Set(),
          artistSet: new Set(),
          notableCount: 0,
          composerLyricistSet: new Set(),
        };
      }

      if (node.nodeType === 'Song') genreMap[genre].songCount += 1;
      if (node.nodeType === 'Album') genreMap[genre].albumCount += 1;
      if (node.notable) genreMap[genre].notableCount += 1;
      if (node.label) genreMap[genre].labelSet.add(node.label);
      if (node.artist) genreMap[genre].artistSet.add(node.artist);
      if (node.composer) genreMap[genre].composerLyricistSet.add(node.composer);
      if (node.lyricist) genreMap[genre].composerLyricistSet.add(node.lyricist);
    }
  });

  return {
    genres: Object.keys(genreMap),
    data: Object.values(genreMap).map(g => ({
      genre: g.genre,
      songCount: g.songCount,
      albumCount: g.albumCount,
      recordLabels: g.labelSet.size,
      artists: g.artistSet.size,
      notable: g.notableCount,
      composersLyricists: g.composerLyricistSet.size,
    })),
  };
}

export function getInfluenceData({ links }, yearRange, targetGenre) {
  const influenceTypes = [
    'lyrical reference', 'interpolates from', 'in style of',
    'cover of', 'directly samples'
  ];

  const influenceCounts = influenceTypes.reduce((acc, type) => {
    acc[type] = 0;
    return acc;
  }, {});

  links.forEach(link => {
    if (
      link.type &&
      influenceCounts.hasOwnProperty(link.type) &&
      link.year >= yearRange[0] &&
      link.year <= yearRange[1] &&
      (link.sourceGenre === targetGenre || link.targetGenre === targetGenre)
    ) {
      influenceCounts[link.type]++;
    }
  });

  return Object.entries(influenceCounts).map(([type, count]) => ({
    type,
    count,
  }));
}
