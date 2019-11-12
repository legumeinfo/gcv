// NgRx
import { createReducer, on } from '@ngrx/store';
// store
import * as LayoutActions from '@gcv/gene/store/actions/layout.actions';

export const layoutFeatureKey = 'layout';

export interface State {
  showSidenav: boolean;
}

const initialState: State = {
  showSidenav: false,
};

export const reducer = createReducer(
  initialState,
  // Even thought the `state` is unused, it helps infer the return type
  on(LayoutActions.CloseSidenav, state => ({showSidenav: false})),
  on(LayoutActions.OpenSidenav, state => ({showSidenav: true})),
  on(LayoutActions.ToggleSidenav, state => ({showSidenav: !state.showSidenav}))
);
