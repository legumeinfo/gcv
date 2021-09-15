// A chromosome is an instance of Track that represents an entire chromosome
// as an ordered list of genes and a corresponding list of gene families. This
// file provides an NgRx reducer for storing chromosome data. Specifically, a
// chromosome is loaded as a Track for each gene provided by the user. These
// Tracks are stored by the chromosome reducer and made available via selectors.
// This includes a selector that provides the neighborhood each user provided
// gene occurs is as a slice of the gene's chromosome - a micro-track.

// NgRx
import { createEntityAdapter, EntityState } from '@ngrx/entity';
// store
import * as chromosomeActions from '@gcv/gene/store/actions/chromosome.actions';
import { TrackID, trackID } from '@gcv/gene/store/utils';
import { ActionID } from '@gcv/store/utils';
// app
import { idArrayLeftDifferenceFactory, idArrayIntersectionFactory }
  from '@gcv/core/utils/id-array.util';
import { Track } from '@gcv/gene/models';


export const chromosomeFeatureKey = 'chromosome';


const adapter = createEntityAdapter<Track>({
  selectId: (e) => trackID(e.name, e.source)
});


export interface State extends EntityState<Track> {
  failed: TrackID[];
  loaded: TrackID[];
  loading: (TrackID & ActionID)[];
}


const initialState: State = adapter.getInitialState({
  failed: [],
  loaded: [],  // need for checking raw IDs
  loading: [],
});


export function chromosomeActionID({action, ...cID}: TrackID & ActionID): string {
  return `${trackID(cID)}:${action}`;
}


export const idArrayLeftDifference =
  idArrayLeftDifferenceFactory(chromosomeActionID, trackID);


export const idArrayIntersection =
  idArrayIntersectionFactory(chromosomeActionID, trackID);


export function reducer(
  state = initialState,
  action: chromosomeActions.Actions
): State {
  switch (action.type) {
    case chromosomeActions.CLEAR:
      // TODO: can we just return the initial state?
      return adapter.removeAll({
        ...state,
        failed: [],
        loaded: [],
        loading: [],
      });
    case chromosomeActions.GET:
      const {name, source} = action.payload;
      let targetIDs = [{name, source, action: action.id}];
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
    case chromosomeActions.GET_SUCCESS:
    {
      const {chromosome} = action.payload;
      let targetIDs = [{name: chromosome.name, source: chromosome.source}];
      // remove IDs from loading
      const loading = idArrayLeftDifference(state.loading, targetIDs);
      // add IDs to loaded
      targetIDs = idArrayLeftDifference(targetIDs, state.loaded);
      const loaded = state.loaded.concat(targetIDs);
      return adapter.addOne(
        chromosome,
        {
          ...state,
          loading,
          loaded,
        },
      );
    }
    case chromosomeActions.GET_FAILURE:
    {
      const {name, source} = action.payload;
      let targetIDs = [{name, source}];
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
