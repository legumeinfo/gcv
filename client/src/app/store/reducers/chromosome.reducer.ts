import { createEntityAdapter, EntityState } from "@ngrx/entity";
import { createFeatureSelector, createSelector } from "@ngrx/store";
import * as fromGene from "./gene.reducer";
import * as fromRouter from "./router.store";
import * as chromosomeActions from "../actions/chromosome.actions";
import { Gene, Track } from "../../models";

declare var Object: any;  // because TypeScript doesn't support Object.values

export type ChromosomeID = {name: string, source: string};

const chromosomeID = (name: string, source: string) => `${name}:${source}`;

const adapter = createEntityAdapter<Track>({
  selectId: (e) => chromosomeID(e.name, e.source)
});

// TODO: is loaded even necessary or can it be derived from entity ids and
// selectedChromosomeIDs selector?
export interface State extends EntityState<Track> {
  failed: ChromosomeID[];
  loaded: ChromosomeID[];
  loading: ChromosomeID[];
}

const initialState: State = adapter.getInitialState({
  failed: [],
  loaded: [],
  loading: [],
});

export function reducer(
  state = initialState,
  action: chromosomeActions.Actions
): State {
  switch (action.type) {
    case chromosomeActions.GET:
      return {
        ...state,
        loading: state.loading.concat([action.payload]),
      };
    case chromosomeActions.GET_SUCCESS:
    {
      const chromosome = action.payload.chromosome;
      const id = {name: chromosome.name, source: chromosome.source};
      return adapter.addOne(
        chromosome,
        {
          ...state,
          loaded: state.loaded.concat(id),
          loading: state.loading.filter(({name, source}) => {
            return !(name === id.name && source === id.source);
          }),
        },
      );
    }
    case chromosomeActions.GET_FAILURE:
    {
      const id = action.payload;
      return {
        ...state,
        failed: state.failed.concat(action.payload),
        loading: state.loading.filter(({name, source}) => {
          return !(name === id.name && source === id.source);
        }),
      };
    }
    default:
      return state;
  }
}

export const getChromosomeState = createFeatureSelector<State>("chromosome");

// TODO: replace with entity selector
// https://ngrx.io/guide/entity/adapter#entity-selectors
export const getAll = createSelector(
  getChromosomeState,
  (state: State): Track[] => Object.values(state.entities),
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

export const getLoadState = createSelector(
  getChromosomeState,
  (state: State) => {
    return {
      failed: state.failed,
      loading: state.loading,
      loaded: state.loaded,
    };
  },
);

export const getLoading = createSelector(
  getLoadState,
  (state): ChromosomeID[] => state.loading,
);

export const getLoaded = createSelector(
  getLoadState,
  (state): ChromosomeID[] => state.loaded,
);

export const getFailed = createSelector(
  getLoadState,
  (state): ChromosomeID[] => state.failed,
);

export const selectionComplete = createSelector(
  fromGene.selectionComplete,
  getLoadState,
  getSelectedChromosomeIDs,
  (genesComplete, state, ids: ChromosomeID[]): boolean => {
    if (!genesComplete) {
      return false;
    }
    const id2string = ({name, source}) => chromosomeID(name, source);
    const loadedIDs = state.loaded.map(id2string);
    const loadedIDset = new Set(loadedIDs);
    const failedIDs = state.failed.map(id2string);
    const failedIDset = new Set(failedIDs);
    return ids
      .map(id2string)
      .every((id) => loadedIDset.has(id) || failedIDset.has(id));
  },
);

export const hasChromosome = (name: string, source: string) => createSelector(
  getChromosomeState,
  (state: State): boolean => chromosomeID(name, source) in state.entities,
);
