import { geneMap } from '@gcv/gene/models/shims';


// takes an array of alignment segment identifiers and returns an array of
// intervals corresponding to the non-null contiguous segments in the array.
function _segmentIntervals(segments: (number|null)[]): Array<[number, number]> {
  const intervals = [];
  let prev = null;
  let interval = null;
  segments.forEach((s, i) => {
    // end an interval
    if (s != prev && prev != null) {
      interval.push(i-1);
      intervals.push(interval);
      interval = null;
    }
    // begin a new interval
    if (s != null && prev != s) {
      interval = [i];
    }
    prev = s;
  });
  // end case
  if (interval != null) {
    interval.push(segments.length-1);
    intervals.push(interval);
  }
  return intervals;
}


// packs the given intervals into one or more schedules such that all intervals
// are in one and only one schedule, no two intervals in a schedule overlap, the
// number of intervals in each schedule is maximized, and, therefore, the number
// of schedules is minimized.
// assumes intervals are sorted by finish time
function _greedyIntervalScheduling<T>(intervals: ({begin: number, end: number} & T)[]):
({begin: number, end: number} & T)[][] {
  const schedules = [];
  intervals.forEach((o) => {
    // add to an existing schedule
    for (let j = 0; j < schedules.length; j++) {
      const schedule = schedules[j];
      const o2 = schedule[schedule.length-1];
      if (o2.end < o.begin) {
        schedule.push(o);
        return;
      }
    }
    // create a new schedule
    const schedule = [o];
    schedules.push(schedule);
  });
  return schedules;
}


function _tracksToData(tracks, genes) {
  const map = geneMap(genes);
  return tracks.map((t, j) => {

      // assign y values based on orientation, segment, and coordinates

      const forwardSegments =
        t.segments.map((s, i) => (t.orientations[i] == 1) ? s : null);
      const forwardIntervals = _segmentIntervals(forwardSegments);
      const forwardIntervalObjects = forwardIntervals
        .map(([i, j]) => {
          return {
            i,
            j,
            begin: t.alignment[i],
            end: t.alignment[j],
          };
        })
        .sort((o1, o2) => o1.end-o2.end);
      const forwardSchedules = _greedyIntervalScheduling(forwardIntervalObjects);

      const reverseSegments =
        t.segments.map((s, i) => (t.orientations[i] == -1) ? s : null);
      const reverseIntervals = _segmentIntervals(reverseSegments);
      const reverseIntervalObjects = reverseIntervals
        .map(([i, j]) => {
          return {
            i,
            j,
            begin: t.alignment[j],  // swapped because reverse coordinates descend
            end: t.alignment[i],
          };
        })
        .sort((o1, o2) => o1.end-o2.end);
      const reverseSchedules = _greedyIntervalScheduling(reverseIntervalObjects)
        .map((schedule) => schedule.reverse());


      const schedules = forwardSchedules.concat(reverseSchedules)
        .sort((schedule1, schedule2) => schedule1[0].i-schedule2[0].i);
      const ys = Array(t.genes.length).fill(null);
      schedules.forEach((schedule, y) => {
        schedule.forEach((o) => {
          for (let i = o.i; i <= o.j; i++) {
            ys[i] = y;
          }
        });
      });

      // make the track
      const track = {
          source: t.source,
          genus: t.genus,
          species: t.species,
          chromosome_name: t.name,
          genes: [],
        };

      // make the track's genes
      t.genes.forEach((name, i) => {
        const x = t.alignment[i];
        if (x !== null) {
          const gene = {
              name: name,
              family: t.families[i],
              x: x,
              y: ys[i],
              fmin: 0,
              fmax: 0,
              strand: undefined,
            };
          if (name in map) {
            Object.assign(gene, map[name]);
          }
          if (gene.strand != undefined) {
            gene.strand *= t.orientations[i];
          }
          track.genes.push(gene);
        }
      });

      return track;
    });
}


// convert track and gene data into a visualization friendly format
export function microShim(clusterID, queryTracks, tracks, genes) {
  // create data
  const filteredTracks = tracks.filter((t) => t.cluster == clusterID);
  const data = _tracksToData(filteredTracks, genes);
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
