// Angular
import { Validators } from '@angular/forms';
// app


export type MacroFilterParams = {
  bregexp: string,  // Algorithm ID
};


export const macroFilterParamMembers = [
  'bregexp',
];


export const macroFilterParamValidators = {
  bregexp: Validators.compose([
    Validators.pattern('.*?'),  // TODO: is this necessary?
  ]),
};


export const macroFilterParamParsers = {
  bregexp: (s) => s,
};
