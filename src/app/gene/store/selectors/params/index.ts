// NgRx
import { createSelector, createSelectorFactory } from '@ngrx/store';
// store
import { selectQueryParams } from '@gcv/store/selectors/router';
import { initialState } from '@gcv/gene/store/reducers/params.reducer';
// app
import { parseParams } from '@gcv/core/models/params';
import { memoizeObject, pick } from '@gcv/core/utils';
import {
  Params, paramMembers, paramParsers,
  AlignmentParams, alignmentParamMembers,
  BlockParams, blockParamMembers,
  ClusteringParams, clusteringParamMembers,
  MacroFilterParams, macroFilterParamMembers,
  MacroOrderParams, macroOrderParamMembers,
  MicroFilterParams, microFilterParamMembers,
  MicroOrderParams, microOrderParamMembers,
  QueryParams, queryParamMembers,
  SourceParams, sourceParamMembers,
} from '@gcv/gene/models/params';


export const getParams = createSelectorFactory(memoizeObject)(
  selectQueryParams,
  (queryParams): Params => {
    // assumes params from URL are valid (see QueryParamsGuard)
    const geneParams = pick(paramMembers, queryParams);
    const urlParams = parseParams(geneParams, paramParsers);
    return Object.assign({}, initialState, urlParams);
  },
);


export const getAlignmentParams = createSelectorFactory(memoizeObject)(
  getParams,
  (params: Params): AlignmentParams => {
    const alignmentParams = pick(alignmentParamMembers, params);
    return alignmentParams;
  },
);


export const getBlockParams = createSelectorFactory(memoizeObject)(
  getParams,
  (params: Params): BlockParams => {
    const blockParams = pick(blockParamMembers, params);
    return blockParams;
  },
);


export const getClusteringParams = createSelectorFactory(memoizeObject)(
  getParams,
  (params: Params): ClusteringParams => {
    const clusteringParams = pick(clusteringParamMembers, params);
    return clusteringParams;
  },
);


export const getMacroFilterParams = createSelectorFactory(memoizeObject)(
  getParams,
  (params: Params): MacroFilterParams => {
    const macroFilterParams = pick(macroFilterParamMembers, params);
    return macroFilterParams;
  },
);


export const getMacroOrderParams = createSelectorFactory(memoizeObject)(
  getParams,
  (params: Params): MacroOrderParams => {
    const macroOrderParams = pick(macroOrderParamMembers, params);
    return macroOrderParams;
  },
);


export const getMicroFilterParams = createSelectorFactory(memoizeObject)(
  getParams,
  (params: Params): MicroFilterParams => {
    const microFilterParams = pick(microFilterParamMembers, params);
    return microFilterParams;
  },
);


export const getMicroOrderParams = createSelectorFactory(memoizeObject)(
  getParams,
  (params: Params): MicroOrderParams => {
    const microOrderParams = pick(microOrderParamMembers, params);
    return microOrderParams;
  },
);


export const getQueryParams = createSelectorFactory(memoizeObject)(
  getParams,
  (params: Params): QueryParams => {
    const queryParams = pick(queryParamMembers, params);
    return queryParams;
  },
);


export const getQueryNeighborParam = createSelector(
  getQueryParams,
  (params: QueryParams): number => params.neighbors,
);


export const getSourceParams = createSelectorFactory(memoizeObject)(
  getParams,
  (params: Params): SourceParams => {
    const sourceParams = pick(sourceParamMembers, params);
    return sourceParams;
  },
);


export const getSourcesParam = createSelector(
  getSourceParams,
  (params: SourceParams): string[] => params.sources,
);
