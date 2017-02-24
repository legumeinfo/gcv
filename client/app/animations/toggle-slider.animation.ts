// Angular
import { animate, state, style, transition, trigger } from '@angular/core';

// App
import { SLIDER_ACTIVE, SLIDER_INACTIVE } from '../constants/toggle-slider';

export const toggleSlider = trigger('toggleSlider', [
  state(SLIDER_ACTIVE, style({width: '25%', visibility: 'visible'})),
  state(SLIDER_INACTIVE, style({width: '0%', visibility: 'hidden'})),
  transition(
    SLIDER_INACTIVE + ' => ' + SLIDER_ACTIVE,
    animate('100ms ease-in')
  ),
  transition(
    SLIDER_ACTIVE + ' => ' + SLIDER_INACTIVE,
    animate('100ms ease-out')
  )
]);
