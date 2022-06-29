// NgRx
import { createReducer, on } from '@ngrx/store';
// store
import * as LayoutActions from '@gcv/gene/store/actions/layout.actions';

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
  on(LayoutActions.CloseLeftSlider, (state) => {
    return {
      ...state,
      showLeftSlider: false,
    };
  }),
  on(LayoutActions.OpenLeftSlider, (state) => {
    return {
      ...state,
      showLeftSlider: true,
    };
  }),
  on(LayoutActions.ToggleLeftSlider, (state) => {
    return {
      ...state,
      showLeftSlider: !state.showLeftSlider,
    };
  }),
  on(LayoutActions.ToggleLeftSliderContent, (state, {content}) => {
    return {
      ...state,
      showLeftSlider: (state.leftSliderContent !== content) || !state.showLeftSlider,
      leftSliderContent: content,
    };
  }),
);
