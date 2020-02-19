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
import { ActionID, TrackID, trackID } from '@gcv/gene/store/utils';
// app
import { Track } from '@gcv/gene/models';

declare var Object: any;  // because TypeScript doesn't support Object.values

export const chromosomeFeatureKey = 'chromosome';

const adapter = createEntityAdapter<Track>({
  selectId: (e) => trackID(e.name, e.source)
});

export interface State extends EntityState<Track> {
  failed: TrackID[];
  loading: (TrackID & ActionID)[];
}

const initialState: State = adapter.getInitialState({
  failed: [],
  loading: [],
});

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
        loading: [],
      });
    case chromosomeActions.GET:
      const loadingIDs = new Set(state.loading.map(trackID));
      const id = trackID(action.payload);
      const loading = [];
      if (!loadingIDs.has(id) && !(id in state.entities)) {
        loading.push({action: action.id, ...action.payload});
      }
      const failed = state.failed.filter(({name, source}) => {
          const fID = trackID(name, source);
          return fID === id;
        });
      return {
        ...state,
        loading: state.loading.concat(loading),
        failed,
      };
    case chromosomeActions.GET_SUCCESS:
    {
      const chromosome = action.payload.chromosome;
      const id = {name: chromosome.name, source: chromosome.source};
      return adapter.addOne(
        chromosome,
        {
          ...state,
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
