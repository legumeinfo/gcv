// A chromosome is an instance of Track that represents an entire chromosome
// as an ordered list of genes and a corresponding list of gene families. This
// file provides an NgRx reducer and selectors for storing and accessing
// chromosome data. Specifically, a chromosome is loaded as a Track for each
// gene provided by the user. These Tracks are stored by the chromosome reducer
// and made available via selectors. This includes a selector that provides the
// neighborhood each user provided gene occurs is as a slice of the gene's
// chromosome.

// NgRx
import { createEntityAdapter, EntityState } from "@ngrx/entity";
import { createFeatureSelector, createSelector, select } from "@ngrx/store";
import { pipe } from "rxjs";
import { filter, map, withLatestFrom } from "rxjs/operators";
// store
import * as fromGene from "./gene.reducer";
import * as fromRouter from "./router.store";
import * as chromosomeActions from "../actions/chromosome.actions";
// app
import { Gene, Track } from "../../models";

declare var Object: any;  // because TypeScript doesn't support Object.values

export type ChromosomeID = {name: string, source: string};

function chromosomeID(name: string, source: string): string;
function chromosomeID({name, source}): string;
function chromosomeID(...args): string {
  if (typeof args[0] === "object") {
    const id = args[0];
    return chromosomeID(id.name, id.source);
  }
  const [name, source] = args;
  return `${name}:${source}`;
}

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
