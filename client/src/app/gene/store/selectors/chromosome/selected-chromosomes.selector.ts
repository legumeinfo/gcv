// NgRx
import { createSelectorFactory } from '@ngrx/store';
// store
import { State } from '@gcv/gene/store/reducers/chromosome.reducer';
import { getQueryNeighborParam } from '@gcv/gene/store/selectors/params';
import { getSelectedGenes }
  from '@gcv/gene/store/selectors/gene/selected-genes.selector';
import { trackID, TrackID } from '@gcv/gene/store/utils';
import { getChromosomeState } from './chromosome-state.selector';
// app
import { Gene, Track } from '@gcv/gene/models';
import { memoizeArray } from '@gcv/core/utils';


// derive selected chromosome from Gene State
export const getSelectedChromosomeIDs = createSelectorFactory(memoizeArray)(
  getSelectedGenes,
  (genes: Gene[]): TrackID[] => {
    const reducer = (accumulator, gene) => {
        const name = gene.chromosome;
        const source = gene.source;
        const id = trackID(name, source);
        accumulator[id] = {name, source}; 
        return accumulator;
      };
    const chromosomeMap = genes.reduce(reducer, {});
    return Object.values(chromosomeMap);
  },
);

export const getSelectedChromosomes = createSelectorFactory(memoizeArray)(
  getChromosomeState,
  getSelectedChromosomeIDs,
  (state: State, ids: TrackID[]): Track[] => {
    const reducer = (accumulator, {name, source}) => {
        const id = trackID(name, source);
        if (id in state.entities) {
          accumulator[id] = state.entities[id];
        }
        return accumulator;
      };
    const selectedChromosomes = ids.reduce(reducer, {});
    return Object.values(selectedChromosomes);
  },
);

// derive selected tracks from Chromosome and Gene States
export const getSelectedSlices = createSelectorFactory(memoizeArray)(
  getSelectedChromosomes,
  getSelectedGenes,
  getQueryNeighborParam,
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

export const getUnloadedSelectedChromosomeIDs =
createSelectorFactory(memoizeArray)(
  getChromosomeState,
  getSelectedChromosomeIDs,
  (state: State, ids: TrackID[]): TrackID[] => {
    const loadingIDs = new Set(state.loading.map(trackID));
    const loadedIDs = new Set(state.ids as string[]);
    const unloadedIDs = ids.filter((id) => {
        const idString = trackID(id);
        return !loadingIDs.has(idString) && !loadedIDs.has(idString);
      });
    return unloadedIDs;
  },
);
