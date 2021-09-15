// NgRx
import { createSelector } from '@ngrx/store';
// store
import { State } from '@gcv/gene/store/reducers/layout.reducer';
import { getLayoutState } from './layout-state.selector';


export const getShowLeftSlider = createSelector(
  getLayoutState,
  (state: State) => state.showLeftSlider,
);


export const getLeftSliderContent = createSelector(
  getLayoutState,
  (state: State) => state.leftSliderContent,
);
