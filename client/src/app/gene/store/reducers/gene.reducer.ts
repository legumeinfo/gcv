// A Gene is a second class citizen in the GCV, that is, other than dictating
// what chromosomes are loaded, all visualizations, algorithms, and auxiliary
// models are derived from the gene families of the Track model. As such, genes
// are loaded on an as needed basis. This file contains an NgRx reducer and
// selectors for storing and accessing Genes.

// NgRx
import { createEntityAdapter, EntityState } from '@ngrx/entity';
// store
import * as geneActions from '@gcv/gene/store/actions/gene.actions';
// app
import { Gene } from '@gcv/gene/models';

declare var Object: any;  // because TypeScript doesn't support Object.values

export const geneFeatureKey = 'gene';

export type GeneID = {name: string, source: string};

export function geneID(name: string, source: string): string;
export function geneID({name, source}): string;
export function geneID(...args): string {
  if (typeof args[0] === 'object') {
    const id = args[0];
    return geneID(id.name, id.source);
  }
  const [name, source] = args;
  return `${name}:${source}`;
}

const adapter = createEntityAdapter<Gene>({
  selectId: (e) => geneID(e.name, e.source)
});

// TODO: is loaded even necessary or can it be derived from entity ids and
// selectedGeneIDs selector?
export interface State extends EntityState<Gene> {
  failed: GeneID[];
  loaded: GeneID[];
  loading: GeneID[];
}

const initialState: State = adapter.getInitialState({
  failed: [],
  loaded: [],
  loading: [],
});

export function reducer(
  state = initialState,
  action: geneActions.Actions
): State {
  switch (action.type) {
    case geneActions.GET:
      const source = action.payload.source;
      const loading = action.payload.names.map((name) => ({name, source}));
      return {
        ...state,
        loading: state.loading.concat(loading),
      };
    case geneActions.GET_SUCCESS:
    {
      const genes = action.payload.genes;
      const loaded = genes.map((g) => ({name: g.name, source: g.source}));
      const loadedIDs = loaded.map(({name, source}) => geneID(name, source));
      const loadedIDset = new Set(loadedIDs);
      const loading = state.loading.filter(({name, source}) => {
          const id = geneID(name, source);
          return !loadedIDset.has(id);
        });
      return adapter.addMany(
        genes,
        {
          ...state,
          loaded: state.loaded.concat(loaded),
          loading,
        },
      );
    }
    case geneActions.GET_FAILURE:
    {
      const names = action.payload.names;
      const source = action.payload.source;
      const failed = names.map((name) => ({name, source}));
      const failedIDs = failed.map(({name, source}) => geneID(name, source));
      const failedIDset = new Set(failedIDs);
      const loading = state.loading.filter(({name, source}) => {
          const id = geneID(name, source);
          return !failedIDset.has(id);
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
