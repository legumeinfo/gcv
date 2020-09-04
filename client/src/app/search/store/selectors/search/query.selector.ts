// Angular
import { Params } from '@angular/router';
// NgRx
import { createSelectorFactory } from '@ngrx/store';
// store
import { selectQueryParams } from '@gcv/store/selectors/router';
// app
import { memoizeValue } from '@gcv/core/utils';


export const getQuery = createSelectorFactory(memoizeValue)(
  selectQueryParams,
  (params: Params): string => params['q'] || '',
);
