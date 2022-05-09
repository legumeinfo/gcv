// This reduce stores state related to the layout of the Gene application.


// NgRx
import { createReducer, on } from '@ngrx/store';
// store
import * as layoutActions from '@gcv/gene/store/actions/layout.actions';


export const layoutFeatureKey = 'layout';


export interface State {
  showLeftSlider: boolean;
  leftSliderContent: string;
}

const initialState: State = {
  showLeftSlider: false,
  leftSliderContent: null,
};

export const reducer = createReducer(
  initialState,
  on(layoutActions.CloseLeftSlider, (state) => {
    return {
      ...state,
      showLeftSlider: false,
    };
  }),
  on(layoutActions.OpenLeftSlider, (state) => {
    return {
      ...state,
      showLeftSlider: true,
    };
  }),
  on(layoutActions.ToggleLeftSlider, (state) => {
    return {
      ...state,
      showLeftSlider: !state.showLeftSlider,
    };
  }),
  on(layoutActions.ToggleLeftSliderContent, (state, {content}) => {
    return {
      ...state,
      showLeftSlider: (state.leftSliderContent !== content) || !state.showLeftSlider,
      leftSliderContent: content,
    };
  }),
);
