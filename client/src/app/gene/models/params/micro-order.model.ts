// Angular
import { Validators } from '@angular/forms';
// app
import { MICRO_ORDER_ALGORITHMS } from '@gcv/gene/algorithms';


export type MicroOrderParams = {
  order: string,
};


export const microOrderParamMembers = [
  'order',
];


export const microOrderParamValidators = {
  order: Validators.compose([
    Validators.required,
    Validators.pattern(MICRO_ORDER_ALGORITHMS.map((a) => a.id).join('|')),
  ]),
};


export const microOrderParamParsers = {
  order: (s) => s,
};
