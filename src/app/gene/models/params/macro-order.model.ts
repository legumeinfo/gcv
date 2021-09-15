// Angular
import { Validators } from '@angular/forms';
// app
import { MACRO_ORDER_ALGORITHMS } from '@gcv/gene/algorithms';


export type MacroOrderParams = {
  border: string,
};


export const macroOrderParamMembers = [
  'border',
];


export const macroOrderParamValidators = {
  border: Validators.compose([
    Validators.required,
    Validators.pattern(MACRO_ORDER_ALGORITHMS.map((a) => a.id).join('|')),
  ]),
};


export const macroOrderParamParsers = {
  border: (s) => s,
};
