// use the "breakpoint reversal sort" technique to identify segments
// (inversions and rearrangements) and their orientations
function _coordinatesToSegments(a: any[]) {
  const indexes = a.map((e, i) => i);
  indexes.sort((i, j) => a[j]-a[i]);
  let segment = indexes[0];
  const segments = {
      indexSegments: {},
      segmentOrientations: {}
    };
  segments.indexSegments[indexes[0]] = segment;
  const setSegmentOrientation = (i) => {
      const diff = indexes[i-1]-segment;
      segments.segmentOrientations[segment] = (diff < 0) ? '-' : '+';
    };
  for (let i = 1; i < indexes.length; i++) {
    let diff = indexes[i]-indexes[i-1];
    // a breakpoint
    if (diff !== 1 && diff !== -1) {
      setSegmentOrientation(i);
      segment = indexes[i];
    }
    segments.indexSegments[indexes[i]] = segment;
  }
  setSegmentOrientation(indexes.length);
  return segments;
}


function _tracksToData(tracks, genes) {
  const geneMap = {};
  genes.forEach((g) => geneMap[g.name] = g);
  return tracks.map((t, j) => {
      // make track
      const track = {
          source: t.source,
          genus: t.genus,
          species: t.species,
          chromosome_name: t.name,
          genes: []
        };
      // make track genes
      t.genes.forEach((name, i) => {
        const x = t.alignment[i];
        if (x !== null) {
          const gene = {
              name: name,
              family: t.families[i],
              x: x,
              fmin: 0,
              fmax: 0
            };
          if (name in geneMap) {
            Object.assign(gene, geneMap[name]);
          }
          track.genes.push(gene);
        }
      });
      // use track segments to assign y values and reverse strands
      const segments = _coordinatesToSegments(track.genes.map((g) => g.x));
      let prevSegment = -1;
      let y = -1;
      track.genes.forEach((g, i) => {
        const segment = segments.indexSegments[i];
        const orientation = segments.segmentOrientations[segment];
        if (segment !== prevSegment) {
          y += 1;
        }
        g.y = y%2;
        g.segment = segment;
        if (g.strand !== undefined && orientation ===  '-') {
          g.strand *= -1;
        }
        prevSegment = segment;
      });
      return track;
    });
}


// convert track and gene data into a visualization friendly format
export function microShim(clusterID, queryTracks, tracks, genes) {
  // create data
  const filteredTracks = tracks.filter((t) => t.cluster == clusterID);
  const data = _tracksToData(tracks, genes);
  // identify bold tracks
  const bold = [];
  filteredTracks.forEach((t, i) => {
    if (queryTracks.some((query) => query.isPrototypeOf(t))) {
      bold.push(data[i]);
    }
  });
  // compute (global) family sizes
  const reducer = (accumulator, track) => {
      track.families.forEach((f) => {
        if (!(f in accumulator)) {
          accumulator[f] = 0;
        }
        accumulator[f] += 1;
      });
      return accumulator;
    };
  const familySizes = tracks.reduce(reducer, {});
  return {data, bold, familySizes};
}
