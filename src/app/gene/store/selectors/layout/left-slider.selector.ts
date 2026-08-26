// NgRx
import { createSelector } from '@ngrx/store';
// store
import { State } from '@gcv/gene/store/reducers/layout.reducer';
import { selectLayoutState } from './layout-state.selector';

export const selectShowLeftSlider = createSelector(
  selectLayoutState,
  (state: State) => state.showLeftSlider,
);

export const selectLeftSliderContent = createSelector(
  selectLayoutState,
  (state: State) => state.leftSliderContent,
);
