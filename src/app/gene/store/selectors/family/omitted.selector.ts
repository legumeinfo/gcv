// NgRx
import { createSelector } from '@ngrx/store';
// store
import { State } from '@gcv/gene/store/reducers/family.reducer';
import { getFamilyState } from './family-state.selector';


export const getOmittedFamilies = createSelector(
  getFamilyState,
  (state: State) => state.omitted,
);
