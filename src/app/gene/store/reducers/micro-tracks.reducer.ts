// A micro-track is an instance of Track that represents a slice of a
// chromosome, rather than a chromosome in its entirety. This file provides an
// NgRx reducer and selectors for storing and accessing micro-track data.
//
// There are two types of micro-tracks in the GCV - those derived from the genes
// provided by the user and those similar to the aforementioned. Since the
// entire chromosome for each gene provided by the user is loaded as a Track
// (see ./chromosome.reducer.ts) the micro-tracks for the genes provided by the
// user are derived from their respective chromosome Tracks via a selector and
// aren't explicitly stored by the micro-tracks reducer.
//
// Clustered and multiple aligned versions of the user defined micro-tracks are
// available via selectors. The multiple alignment selector aligns the Tracks
// within each cluster and returns an object containing the aligned tracks and
// an array of consensus sequences - one for each cluster's multiple alignment.
// These consensus sequences are what's used to find micro-tracks that are
// similar to each cluster. The similar micro-tracks found are what's stored by
// the micro-tracks reducer. Similar to the micro-tracks derived from the genes
// provided by the user, aligned versions of the similar micro-tracks are
// available via a selector. In this case, the micro-tracks are pairwise aligned
// to the consensus sequence they correspond to.

// NgRx
import { createEntityAdapter, EntityState } from '@ngrx/entity';
// store
import * as microTrackActions from '@gcv/gene/store/actions/micro-tracks.actions';
// app
import { idArrayLeftDifferenceFactory, idArrayIntersectionFactory }
  from '@gcv/core/utils/id-array.util';
import { Track } from '@gcv/gene/models';
import { ClusterMixin } from '@gcv/gene/models/mixins';
import { ActionID } from '@gcv/store/utils';


declare var Object: any;  // because TypeScript doesn't support Object.values


export const microTracksFeatureKey = 'microtracks';


export type MicroTrackID = {
  cluster: number,
  startGene: string,
  stopGene: string,
  source: string
};


export type PartialMicroTrackID = {
  cluster: number;
  source: string;
};


export function microTrackID(cluster: number, startGene: string,
stopGene: string, source: string): string;
export function microTrackID(track: (Track & ClusterMixin)): string;
export function microTrackID(...args): string {
  if (typeof args[0] === 'object') {
    const track = args[0];
    const startGene = track.genes[0];
    const stopGene = track.genes[track.genes.length-1];
    return microTrackID(track.cluster, startGene, stopGene, track.source);
  }
  const [cluster, startGene, stopGene, source] = args;
  return `${cluster}:${startGene}:${stopGene}:${source}`;
};


export function partialMicroTrackID(cluster: number, source: string): string;
export function partialMicroTrackID({cluster, source}): string;
export function partialMicroTrackID(...args): string {
  if (typeof args[0] === 'object') {
    const id = args[0];
    return partialMicroTrackID(id.cluster, id.source);
  }
  const [cluster, source] = args;
  return `${cluster}:${source}`;
};


const adapter = createEntityAdapter<(Track & ClusterMixin)>({
  selectId: (e) => microTrackID(e)
});


// TODO: is loaded even necessary or can it be derived from entity ids?
export interface State extends EntityState<(Track & ClusterMixin)> {
  failed: PartialMicroTrackID[];
  loaded: PartialMicroTrackID[];
  loading: (PartialMicroTrackID & ActionID)[];
}


export const initialState: State = adapter.getInitialState({
  failed: [],
  loaded: [],  // need loaded because because actual IDs are too specific
  loading: [],
});


export function partialMicroTrackActionID({action, ...trackID}:
PartialMicroTrackID & ActionID): string {
  return `${partialMicroTrackID(trackID)}:${action}`;
}


export const idArrayLeftDifference =
  idArrayLeftDifferenceFactory(partialMicroTrackActionID, partialMicroTrackID);


export const idArrayIntersection =
  idArrayIntersectionFactory(partialMicroTrackActionID, partialMicroTrackID);


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
    {
      const {cluster, source} = action.payload;
      let targetIDs = [{cluster, source, action: action.id}];
      // filter targets by loading and loaded
      targetIDs = idArrayLeftDifference(targetIDs, state.loading);
      targetIDs = idArrayLeftDifference(targetIDs, state.loaded);
      // add filtered target IDs to loading
      const loading = state.loading.concat(targetIDs);
      // remove filtered target IDs from failed
      const failed = idArrayLeftDifference(state.failed, targetIDs);
      return {
        ...state,
        loading,
        failed,
      };
    }
    case microTrackActions.SEARCH_SUCCESS:
    {
      const {cluster, source, tracks} = action.payload;
      let targetIDs = [{cluster, source}];
      // remove IDs from loading
      const loading = idArrayLeftDifference(state.loading, targetIDs);
      // add IDs to loaded
      targetIDs = idArrayLeftDifference(targetIDs, state.loaded);
      const loaded = state.loaded.concat(targetIDs);
      return adapter.addMany(
        tracks,
        {
          ...state,
          loading,
          loaded,
        },
      );
    }
    case microTrackActions.SEARCH_FAILURE:
    {
      const {cluster, source} = action.payload;
      let targetIDs = [{cluster, source}];
      // remove IDs from loading
      const loading = idArrayLeftDifference(state.loading, targetIDs);
      // add IDs to failed
      targetIDs = idArrayLeftDifference(targetIDs, state.failed);
      const failed = state.failed.concat(targetIDs);
      return {
        ...state,
        loading,
        failed,
      };
    }
    default:
      return state;
  }
}
