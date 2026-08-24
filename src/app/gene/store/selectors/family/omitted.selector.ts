// NgRx
import { createSelector } from '@ngrx/store';
// store
import { State } from '@gcv/gene/store/reducers/family.reducer';
import { selectFamilyState } from './family-state.selector';

export const selectOmittedFamilies = createSelector(
  selectFamilyState,
  (state: State) => state.omitted,
);
