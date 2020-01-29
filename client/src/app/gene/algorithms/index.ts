import { ALIGNMENT_ALGORITHMS } from './alignment.algorithm';
import { MACRO_ORDER_ALGORITHMS } from './macro-order.algorithm';
import { MICRO_ORDER_ALGORITHMS } from './micro-order.algorithm';

export const algorithms: any[] = [
  ALIGNMENT_ALGORITHMS,
  MACRO_ORDER_ALGORITHMS,
  MICRO_ORDER_ALGORITHMS,
];

export * from './alignment.algorithm';
export * from './macro-order.algorithm';
export * from './micro-order.algorithm';
