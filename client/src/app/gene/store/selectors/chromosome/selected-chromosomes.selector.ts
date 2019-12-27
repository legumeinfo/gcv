// NgRx
import { createSelector } from '@ngrx/store';
// store
import { State } from '@gcv/gene/store/reducers/chromosome.reducer';
import { getMicroQueryParamNeighbors } from '@gcv/gene/store/selectors/router/';
import { getSelectedGenes }
  from '@gcv/gene/store/selectors/gene/selected-genes.selector';
import { trackID, TrackID } from '@gcv/gene/store/utils';
import { getChromosomeState } from './chromosome-state.selector';
// app
import { Gene, Track } from '@gcv/gene/models';


// derive selected chromosome from Gene State
export const getSelectedChromosomeIDs = createSelector(
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

export const getSelectedChromosomes = createSelector(
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
export const getSelectedSlices = createSelector(
  getSelectedChromosomes,
  getSelectedGenes,
  getMicroQueryParamNeighbors,
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

export const getUnloadedSelectedChromosomeIDs = createSelector(
  getChromosomeState,
  getSelectedChromosomeIDs,
  (state: State, ids: TrackID[]): TrackID[] => {
    const loadingIDs = new Set(state.loading.map(trackID));
    const loadedIDs = new Set(state.loaded.map(trackID));
    const unloadedIDs = ids.filter((id) => {
        const idString = trackID(id);
        return !loadingIDs.has(idString) && !loadedIDs.has(idString);
      });
    return unloadedIDs;
  },
);
