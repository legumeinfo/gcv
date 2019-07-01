import { createEntityAdapter, EntityState } from "@ngrx/entity";
import { createFeatureSelector, createSelector } from "@ngrx/store";
import * as fromChromosome from "./chromosome.reducer";
import * as fromGene from "./gene.reducer";
import * as fromRouter from "./router.store";
import * as microTrackActions from "../actions/micro-tracks.actions";
import { Gene, Track } from "../../models";

declare var Object: any;  // because TypeScript doesn't support Object.values

// TODO: include graph from clustering
export type MicroTrackID = {startGene: string, stopGene: string, source: string};

const microTrackID = (startGene: string, stopGene: string, source: string) => {
  return `${startGene}:${stopGene}:${source}`;
};

const adapter = createEntityAdapter<Track>({
  selectId: (e) => {
    const startGene = e.genes[0];
    const stopGene = e.genes[e.genes.length-1];
    return microTrackID(startGene, stopGene, e.source);
  }
});

// TODO: is loaded even necessary or can it be derived from entity ids?
export interface State extends EntityState<Track> {
  failed: string[];  // TODO: include group from clustering
  loaded: string[];  // ditto
  loading: string[];  // ditto
}

export const initialState: State = adapter.getInitialState({
  failed: [],
  loaded: [],
  loading: [],
});

export function reducer(
  state = initialState,
  action: microTrackActions.Actions,
): State {
  switch (action.type) {
    case microTrackActions.CLEAR:
      // TODO: can we just return the initial state?
      return adapter.removeAll({
        ...state,
        failed: [],
        loaded: [],
        loading: [],
      });
    case microTrackActions.SEARCH:
      const source = action.payload.source;
      return {
        ...state,
        loading: state.loading.concat([source]),
      };
    case microTrackActions.SEARCH_SUCCESS:
    {
      const tracks = action.payload.tracks;
      const source = action.payload.source;
      return adapter.addMany(
        tracks,
        {
          ...state,
          loaded: state.loaded.concat(source),
          loading: state.loading.filter((s) => s !== source),
        },
      );
    }
    case microTrackActions.SEARCH_FAILURE:
    {
      const source = action.payload.source;
      return {
        ...state,
        failed: state.failed.concat(source),
        loading: state.loading.filter((s) => s !== source),
      };
    }
    default:
      return state;
  }
}

export const getMicroTracksState = createFeatureSelector<State>("micro-tracks");

export const getMicroTracks = createSelector(
  getMicroTracksState,
  (state) => Object.values(state.entities),
);

// derive selected tracks from Chromosome and Gene States
export const getSelectedMicroTracks = createSelector(
  fromChromosome.getSelectedChromosomes,
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
  getMicroTracksState,
  (state) => {
    return {
      failed: state.failed,
      loading: state.loading,
      loaded: state.loaded,
    };
  }
);

export const getLoading = createSelector(
  getLoadState,
  (state): string[] => state.loading,
);

export const getLoaded = createSelector(
  getLoadState,
  (state): string[] => state.loaded,
);

export const getFailed = createSelector(
  getLoadState,
  (state): string[] => state.failed,
);
