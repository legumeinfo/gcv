// NgRx
import { createSelector, select } from '@ngrx/store';
import { pipe } from 'rxjs';
import { map } from 'rxjs/operators';
// store
import * as fromModule from '@gcv/gene/store/reducers';
import * as fromGene from './gene.selectors';
import * as fromRouter from './router.selectors';
import { chromosomeID, ChromosomeID, State }
  from '@gcv/gene/store/reducers/chromosome.reducer';
// app
import { Gene, Track } from '@gcv/gene/models';


export const getChromosomeState = createSelector(
  fromModule.getGeneModuleState,
  state => state['chromosome']
);

// derive selected chromosome from Gene State
export const getSelectedChromosomeIDs = createSelector(
  fromGene.getSelectedGenes,
  (genes: Gene[]): ChromosomeID[] => {
    const reducer = (accumulator, gene) => {
        const name = gene.chromosome;
        const source = gene.source;
        const id = chromosomeID(name, source);
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
  (state: State, ids: ChromosomeID[]): Track[] => {
    const reducer = (accumulator, {name, source}) => {
        const id = chromosomeID(name, source);
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
  fromGene.getSelectedGenes,
  fromRouter.getMicroQueryParamNeighbors,
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
  (state: State, ids: ChromosomeID[]): ChromosomeID[] => {
    const loadingIDs = new Set(state.loading.map(chromosomeID));
    const loadedIDs = new Set(state.loaded.map(chromosomeID));
    const unloadedIDs = ids.filter((id) => {
        const idString = chromosomeID(id);
        return !loadingIDs.has(idString) && !loadedIDs.has(idString);
      });
    return unloadedIDs;
  },
);

const getChromosomeStateAndSelectedChromosomeIDs = createSelector(
  getChromosomeState,
  getSelectedChromosomeIDs,
  (state: State, ids: ChromosomeID[]) => ({state, ids}),
);

// TODO: AND fromGene.selectedLoaded to output
export const selectedLoaded = pipe(
  select(getChromosomeStateAndSelectedChromosomeIDs),
  map(({state, ids}) => {
    const loadedIDs = state.loaded.map(chromosomeID);
    const loadedIDset = new Set(loadedIDs);
    const failedIDs = state.failed.map(chromosomeID);
    const failedIDset = new Set(failedIDs);
    const complete = ids
      .map(chromosomeID)
      .every((id) => loadedIDset.has(id) || failedIDset.has(id));
    return ids
      .map(chromosomeID)
      .every((id) => loadedIDset.has(id) || failedIDset.has(id));
  }),
);
