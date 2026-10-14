// Angular
import { Validators } from '@angular/forms';
// app

export type MicroFilterParams = {
  regexp: string; // Algorithm ID
};

export const microFilterParamMembers = ['regexp'];

export const microFilterParamValidators = {
  regexp: Validators.compose([
    Validators.pattern('.*?'), // TODO: is this necessary?
  ]),
};

export const microFilterParamParsers = {
  regexp: (s) => s,
};
