// NgRx
import { createSelectorFactory } from '@ngrx/store';
// store
import { getSelectedChromosomes }
  from '@gcv/gene/store/selectors/chromosome/selected-chromosomes.selector';
import { getSelectedGenes }
  from '@gcv/gene/store/selectors/gene/selected-genes.selector';
import * as fromParams from '@gcv/gene/store/selectors/params';
// app
import { arrayFlatten, memoizeArray } from '@gcv/core/utils';
import { Gene, Track } from '@gcv/gene/models';


// derive selected tracks from Chromosome and Gene States
export const getSelectedMicroTracks = createSelectorFactory(memoizeArray)(
  getSelectedChromosomes,
  getSelectedGenes,
  fromParams.getQueryNeighborParam,
  (chromosomes: Track[], genes: Gene[], neighbors: number):
  Track[] => {
    const chromosomeMap = {};
    chromosomes.forEach((c) => {
      const id = `${c.name}:${c.source}`;
      chromosomeMap[id] = c;
    });
    // generate track intervals for each chromosome
    const reducer = (accumulator, gene) => {
        const id = `${gene.chromosome}:${gene.source}`;
        if (id in chromosomeMap) {
          const chromosome = chromosomeMap[id];
          const i = chromosome.genes.indexOf(gene.name);
          if (i > -1) {
            const begin = Math.max(0, i-neighbors);
            const end = Math.min(chromosome.genes.length, i+neighbors+1);
            if (!(id in accumulator)) {
              accumulator[id] = [];
            }
            accumulator[id].push([begin, end]);
          }
        }
        return accumulator;
      };
    const selectedIntervals = genes.reduce(reducer, {});
    // combine overlapping intervals and convert result into to tracks
    const tracks = arrayFlatten(
        Object.entries(selectedIntervals)
          .map(([id, intervals]: [string, Array<[number, number]>]) => {
            intervals.sort(([beginA, endA], [beginB, endB]) => {
              if (beginA < beginB) {
                return -1;
              } else if (beginA > beginB) {
                return 1;
              } else if (endA < endB) {
                return -1;
              } else if (endA > endB) {
                return 1;
              }
              return 0;
            });
            const trackIntervals = [];
            let prevEnd = -1;
            intervals.forEach(([begin, end]) => {
              // continue previous track
              if (begin <= prevEnd) {
                trackIntervals[trackIntervals.length-1].end = end;
              // begin new track
              } else {
                trackIntervals.push({begin, end});
              }
              prevEnd = end;
            });
            const chromosome = chromosomeMap[id];
            return trackIntervals.map(({begin, end}) => {
              return {
                ...chromosome,
                genes: chromosome.genes.slice(begin, end),
                families: chromosome.families.slice(begin, end),
              };
            });
          })
      );
    return tracks;
  }
);
