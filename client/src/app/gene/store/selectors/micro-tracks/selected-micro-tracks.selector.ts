// NgRx
import { createSelectorFactory } from '@ngrx/store';
// store
import { getSelectedChromosomes }
  from '@gcv/gene/store/selectors/chromosome/selected-chromosomes.selector';
import { getSelectedGenes }
  from '@gcv/gene/store/selectors/gene/selected-genes.selector';
import * as fromParams from '@gcv/gene/store/selectors/params';
// app
import { memoizeArray } from '@gcv/core/utils';
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
    const reducer = (accumulator, gene) => {
        const id = `${gene.chromosome}:${gene.source}`;
        if (id in chromosomeMap) {
          const chromosome = chromosomeMap[id];
          const i = chromosome.genes.indexOf(gene.name);
          if (i > -1) {
            const begin = Math.max(0, i-neighbors);
            const end = Math.min(chromosome.genes.length, i+neighbors+1);
            const track = {
                ...chromosome,
                genes: chromosome.genes.slice(begin, end),
                families: chromosome.families.slice(begin, end),
              };
            accumulator.push(track);
          }
        }
        return accumulator;
      };
    const tracks = genes.reduce(reducer, []);
    return tracks;
  }
);
