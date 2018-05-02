// Angular
import { animate, state, style, transition, trigger } from "@angular/core";

// App
import { SliderStates } from "../constants/slider-states";

export const toggleSlider = trigger("toggleSlider", [
  state(SliderStates.SLIDER_ACTIVE,
    style({width: "25%", visibility: "visible"})),
  state(SliderStates.SLIDER_INACTIVE,
    style({width: "0%", visibility: "hidden"})),
  transition(
    SliderStates.SLIDER_INACTIVE + " => " + SliderStates.SLIDER_ACTIVE,
    animate("100ms ease-in"),
  ),
  transition(
    SliderStates.SLIDER_ACTIVE + " => " + SliderStates.SLIDER_INACTIVE,
    animate("100ms ease-out"),
  ),
]);
