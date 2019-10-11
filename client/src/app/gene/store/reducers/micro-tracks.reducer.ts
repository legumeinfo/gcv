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
import { Track } from '@gcv/gene/models';
import { ClusterMixin } from '@gcv/gene/models/mixins';

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

const microTrackID = (cluster: number, startGene: string, stopGene: string,
source: string) => {
  return `${cluster}:${startGene}:${stopGene}:${source}`;
};

function partialMicroTrackID(cluster: number, source: string): string;
function partialMicroTrackID({cluster, source}): string;
function partialMicroTrackID(...args): string {
  if (typeof args[0] === 'object') {
    const id = args[0];
    return partialMicroTrackID(id.cluster, id.source);
  }
  const [cluster, source] = args;
  return `${cluster}:${source}`;
};

const adapter = createEntityAdapter<(Track | ClusterMixin)>({
  selectId: (e) => {
    const track = e as Track;
    const cluster = e as ClusterMixin;
    const startGene = track.genes[0];
    const stopGene = track.genes[track.genes.length-1];
    return microTrackID(cluster.cluster, startGene, stopGene, track.source);
  }
});

// TODO: is loaded even necessary or can it be derived from entity ids?
export interface State extends EntityState<(Track | ClusterMixin)> {
  failed: PartialMicroTrackID[];
  loaded: PartialMicroTrackID[];
  loading: PartialMicroTrackID[];
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
    {
      const partialID = {
          cluster: action.payload.cluster,
          source: action.payload.source,
        };
      return {
        ...state,
        loading: state.loading.concat([partialID]),
      };
    }
    case microTrackActions.SEARCH_SUCCESS:
    {
      const tracks = action.payload.tracks;
      const partialID = {
          cluster: action.payload.cluster,
          source: action.payload.source,
        };
      return adapter.addMany(
        tracks,
        {
          ...state,
          loaded: state.loaded.concat(partialID),
          loading: state.loading.filter(({cluster, source}) => {
            return !(cluster === partialID.cluster &&
                     source === partialID.source);
          }),
        },
      );
    }
    case microTrackActions.SEARCH_FAILURE:
    {
      const partialID = {
          cluster: action.payload.cluster,
          source: action.payload.source,
        };
      return {
        ...state,
        failed: state.failed.concat(partialID),
        loading: state.loading.filter(({cluster, source}) => {
          return !(cluster === partialID.cluster &&
                   source === partialID.source);
        }),
      };
    }
    default:
      return state;
  }
}
