import { ALIGNMENT_ALGORITHMS } from './alignment.algorithm';
import { ORDER_ALGORITHMS } from './order.algorithm';

export const algorithms: any[] = [
  ALIGNMENT_ALGORITHMS,
  ORDER_ALGORITHMS,
];

export * from './alignment.algorithm';
export * from './order.algorithm';
