// NgRx
import { createSelector } from '@ngrx/store';
// store
import { State } from '@gcv/gene/store/reducers/layout.reducer';
import { getLayoutState } from './layout-state.selector';


export const getShowSidenav = createSelector(
  getLayoutState,
  (state: State) => state.showSidenav,
);
