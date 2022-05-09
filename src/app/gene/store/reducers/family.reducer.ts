// Gene families are loaded into GCV with the Track (Chromosome/Micro-Track) and
// Gene types. This reducer is intended to store state related to gene families,
// i.e. gene family data itself should be stored in the Track and Gene reducers.

// NgRx
import { createReducer, on } from '@ngrx/store';
// store
import * as familyActions from '@gcv/gene/store/actions/family.actions';


export const familyFeatureKey = 'family';


export interface State {
  omitted: string[];
}


const initialState: State = {
  omitted: [],
};


export const reducer = createReducer(
  initialState,
  on(familyActions.Clear, (state) => {
    return {
      omitted: [],
    };
  }),
  on(familyActions.OmitFamilies, (state, {families}) => {
    const omitted = new Set(state.omitted);
    families.forEach((f) => omitted.add(f));
    return {
      omitted: Array.from(omitted),
    };
  }),
  on(familyActions.IncludeFamilies, (state, {families}) => {
    const omitted = new Set(state.omitted);
    families.forEach((f) => omitted.delete(f));
    return {
      omitted: Array.from(omitted),
    };
  }),
);
