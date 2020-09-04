// NgRx
import { createSelector, createSelectorFactory } from '@ngrx/store';
// store
import { selectQueryParams } from '@gcv/store/selectors/router';
import { initialState } from '@gcv/search/store/reducers/params.reducer';
// app
import { parseParams } from '@gcv/core/models/params';
import { memoizeObject, pick } from '@gcv/core/utils';
import {
  Params, paramMembers, paramParsers,
  SourceParams, sourceParamMembers,
} from '@gcv/search/models/params';


export const getParams = createSelectorFactory(memoizeObject)(
  selectQueryParams,
  (queryParams): Params => {
    // assumes params from URL are valid (see QueryParamsGuard)
    const searchParams = pick(paramMembers, queryParams);
    const urlParams = parseParams(searchParams, paramParsers);
    return Object.assign({}, initialState, urlParams);
  },
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
