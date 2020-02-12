// Angular
import { Validators } from '@angular/forms';
import { Regex } from '@gcv/gene/constants';
// App
import { regexpOr } from '@gcv/gene/utils/regexp-or.util';


export type QueryParams = {
  neighbors: number,
  matched: number,
  intermediate: number,
};


export const queryParamMembers = [
  'neighbors',
  'matched',
  'intermediate',
];


export const queryParamValidators = {
  intermediate: Validators.compose([
    Validators.required,
    Validators.pattern(
      regexpOr(Regex.FRACTION_TO_ONE, Regex.POSITIVE_INT_AND_ZERO)),
  ]),
  matched: Validators.compose([
    Validators.required,
    Validators.pattern(
      regexpOr(Regex.FRACTION_TO_ONE, Regex.POSITIVE_INT)),
  ]),
  neighbors: Validators.compose([
    Validators.required,
    Validators.pattern(Regex.POSITIVE_INT),
  ]),
};


export const queryParamParsers = {
  intermediate: parseFloat,
  matched: parseFloat,
  neighbors: parseInt,
};
