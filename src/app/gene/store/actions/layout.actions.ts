import { createAction, props } from '@ngrx/store';

export const OpenLeftSlider = createAction('[Layout] Open Left Slider');
export const CloseLeftSlider = createAction('[Layout] Close Left Slider');
export const ToggleLeftSlider = createAction('[Layout] Toggle Left Slider');
export const ToggleLeftSliderContent = createAction(
  '[Layout] Set Left Slider Content',
  props<{content: string}>()
);
