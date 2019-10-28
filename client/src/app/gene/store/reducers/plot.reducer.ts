// A Plot is composed of two tracks - a reference and a sequence - and a set of
// index pairs that map genes between tracks that share the same family. Local
// plots are defined from tracks already in view, and global plots are defined
// between a query track and a dynamically loaded track that contains all the
// families present in the query track on the specified chromosome. This reducer
// stores global tracks.

// NgRx
import { createEntityAdapter, EntityState } from '@ngrx/entity';
// store
import * as plotActions from '@gcv/gene/store/actions/plot.actions';
// app
import { Plot, Track } from '@gcv/gene/models';
import { ClusterMixin } from '@gcv/gene/models/mixins';

declare var Object: any;  // because TypeScript doesn't support Object.values

export const plotFeatureKey = 'plot';

export type PlotID = {
  cluster: number;
  referenceStartGene: string;
  referenceStopGene: string;
  referenceSource: string;
  sequenceName: string;
  sequenceSource: string;
}

export function plotID(cluster: number, referenceStartGene: string,
referenceStopGene: string, referenceSource: string, sequenceName: string,
sequenceSource: string): PlotID;
export function plotID(reference: (Track | ClusterMixin), sequence: Track):
  PlotID;
export function plotID(reference: (Track | ClusterMixin), name: string,
source: string): PlotID;
export function plotID(plot: Plot): PlotID;
export function plotID(...args): PlotID {
  if (args.length === 1 && typeof args[0] === 'object') {
    const plot = args[0] as Plot;
    return plotID(plot.reference, plot.sequence);
  } else if (args.length === 2 && typeof args[0] === 'object' &&
  typeof args[1] === 'object') {
    const [reference, sequence] = args;
    const sequenceName = sequence.name;
    const sequenceSource = sequence.source;
    return plotID(reference, sequenceName, sequenceSource);
  } else if (args.length === 3 && typeof args[0] === 'object' &&
  typeof args[1] === 'string' && typeof args[2] === 'string') {
    const [track, name, source] = args;
    const reference = track as Track;
    const cluster = (track as ClusterMixin).cluster;
    const referenceStartGene = reference.genes[0];
    const referenceStopGene = reference.genes[reference.genes.length-1];
    const referenceSource = reference.source;
    return plotID(cluster, referenceStartGene, referenceStopGene, 
      referenceSource, name, source);
  }
  const [cluster, referenceStartGene, referenceStopGene, referenceSource,
    sequenceName, sequenceSource] = args;
  return {
    cluster,
    referenceStartGene,
    referenceStopGene,
    referenceSource,
    sequenceName,
    sequenceSource
  };
}

export function plotIDtoString(id: PlotID): string {
  const {cluster, referenceStartGene, referenceStopGene, referenceSource,
    sequenceName, sequenceSource} = id;
  return `${cluster}:${referenceStartGene}:${referenceStopGene}:` +
         `${referenceSource}:${sequenceName}:${sequenceSource}`;
}

const adapter = createEntityAdapter<Plot>({
  selectId: (e) => plotIDtoString(plotID(e))
});

export interface State extends EntityState<Plot> {
  failed: PlotID[];
  loaded: PlotID[];
  loading: PlotID[];
}

const initialState: State = adapter.getInitialState({
  failed: [],
  loaded: [],
  loading: [],
});

export function reducer(
  state = initialState,
  action: plotActions.Actions
): State {
  switch (action.type) {
    case plotActions.GET:
      const name = action.payload.name;
      const source = action.payload.source;
      const loading = action.payload.tracks.map((track) => {
          return plotID(track, name, source);
        });
      return {
        ...state,
        loading: state.loading.concat(loading),
      };
    case plotActions.GET_SUCCESS:
    {
      const plots = action.payload.plots;
      const loaded = plots.map((p) => plotID(p));
      const loadedIDs = loaded.map((id) => plotIDtoString(id));
      const loadedIDset = new Set(loadedIDs);
      const loading = state.loading.filter((id) => {
          const idString = plotIDtoString(id);
          return !loadedIDset.has(idString);
        });
      return adapter.addMany(
        plots,
        {
          ...state,
          loaded: state.loaded.concat(loaded),
          loading,
        },
      );
    }
    case plotActions.GET_FAILURE:
    {
      const tracks = action.payload.tracks;
      const name = action.payload.name;
      const source = action.payload.source;
      const failed = tracks.map((t) => plotID(t, name, source));
      const failedIDs = failed.map((id) => plotIDtoString(id));
      const failedIDset = new Set(failedIDs);
      const loading = state.loading.filter((id) => {
          const idString = plotIDtoString(id);
          return !failedIDset.has(idString);
        });
      return {
        ...state,
        failed: state.failed.concat(failed),
        loading,
      };
    }
    default:
      return state;
  }
}
