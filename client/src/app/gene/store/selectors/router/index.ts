// NgRx
import { createSelector } from '@ngrx/store';
// store
import * as fromModule from '@gcv/gene/store/reducers';
import { initialState } from '@gcv/gene/store/reducers/router.reducer';
// app
import { AppConfig } from '@gcv/app.config';
import { arrayFlatten } from '@gcv/core/utils';
import { AlignmentParams, BlockParams, ClusteringParams, QueryParams,
  SourceParams } from '@gcv/gene/models/params';
import { instantiateAndPopulate } from '@gcv/gene/utils';


//export const getRouterState = createFeatureSelector
//  <fromRouterStore.RouterReducerState<RouterStateUrl>>('router');
//export const getRouterState = createSelector(
//  fromModule.getGeneModuleState,
//  state => state['router']
//);

export const getRouterState = (state) => state.router;

export const getParams = createSelector(
  getRouterState,
  (route) => route.state.params,
);

export const getRouteGenes = createSelector(
  getRouterState,
  (route): {name: string, source: string}[] => {
    // TODO: can this be handled upstream?
    if (route === undefined ||
        route.state === undefined ||
        route.state.params === undefined) {
      return [];
    }
    const sources = AppConfig.SERVERS.map((s) => s.id);
    const params = route.state.params;
    const selectedGenes = sources
      .filter((source) => source in params)
      .map((source) => params[source].map((name) => ({source, name})));
    return arrayFlatten(selectedGenes);
  },
);

export const getQueryParams = createSelector(
  getRouterState,
  (route) => (route !== undefined) ? route.state.queryParams : {},
);

// app parameters encoded in route query params
export const getSourceParams = createSelector(
  getQueryParams,
  (params) => instantiateAndPopulate(SourceParams, params),
)

export const getSources = createSelector(
  getSourceParams,
  (params) => params.sources,
)

export const getMicroQueryParams = createSelector(
  getQueryParams,
  (params) => instantiateAndPopulate(QueryParams, params),
)

export const getMicroQueryParamNeighbors = createSelector(
  getMicroQueryParams,
  (params) => params.neighbors,
)

export const getMicroAlignmentParams = createSelector(
  getQueryParams,
  (params) => instantiateAndPopulate(AlignmentParams, params || {}),
)

export const getMacroBlockParams = createSelector(
  getQueryParams,
  (params) => instantiateAndPopulate(BlockParams, params || {}),
)

export const getMicroClusteringParams = createSelector(
  getQueryParams,
  (params) => instantiateAndPopulate(ClusteringParams, params || {}),
)

export const getRegexp = createSelector(
  getQueryParams,
  (params) => params.regexp,
)

export const getOrder = createSelector(
  getQueryParams,
  (params) => params.order,
)
