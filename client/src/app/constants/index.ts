import { ALIGNMENT_ALGORITHMS } from "./alignment-algorithms";
import { ORDER_ALGORITHMS } from "./order-algorithms";
import { Regex } from "./regex";
import { SliderStates } from "./slider-states";

export const constants: any[] = [
  ALIGNMENT_ALGORITHMS,
  ORDER_ALGORITHMS,
  Regex,
  SliderStates,
];

export * from "./alignment-algorithms";
export * from "./order-algorithms";
export * from "./regex";
export * from "./slider-states";
