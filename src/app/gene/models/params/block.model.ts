// Angular
import { Validators } from '@angular/forms';
// app
import { Regex } from '@gcv/gene/constants';


export type BlockParams = {
  bmatched: number,
  bintermediate: number,
  bmask: number,
  bchrgenes: number,
  bchrlength: number,
};


export const blockParamMembers = [
  'bmatched',
  'bintermediate',
  'bmask',
  'bchrgenes',
  'bchrlength',
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
  bchrgenes: Validators.compose([
    Validators.pattern(Regex.POSITIVE_INT),
  ]),
  bchrlength: Validators.compose([
    Validators.pattern(Regex.POSITIVE_INT),
  ]),
};


export const blockParamParsers = {
  bintermediate: parseInt,
  bmask: parseInt,
  bmatched: parseInt,
  bchrgenes: parseInt,
  bchrlength: parseInt,
};
