// Angular
import { Validators } from '@angular/forms';
// app
import { Regex } from '@gcv/gene/constants';


export type BlockParams = {
  bmatched: number,
  bintermediate: number,
  bmask: number,
};


export const blockParamMembers = [
  'bmatched',
  'bintermediate',
  'bmask',
];


export const blockParamValidators = {
  bintermediate: Validators.compose([
    Validators.required,
    Validators.pattern(Regex.POSITIVE_INT_AND_ZERO),
  ]),
  bmask: Validators.compose([
    Validators.required,
    Validators.pattern(Regex.POSITIVE_INT),
  ]),
  bmatched: Validators.compose([
    Validators.required,
    Validators.pattern(Regex.POSITIVE_INT),
  ]),
};


export const blockParamParsers = {
  bintermediate: parseInt,
  bmask: parseInt,
  bmatched: parseInt,
};
