// Angular
import { Validators } from '@angular/forms';
// app
import { Regex } from '@gcv/gene/constants';


export type BlockParams = {
  bmatched: number,
  bintermediate: number,
  bmask: number,
  bminChromosomeGenes: number,
  bminChromosomeLength: number,
};


export const blockParamMembers = [
  'bmatched',
  'bintermediate',
  'bmask',
  'bminChromosomeGenes',
  'bminChromosomeLength',
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
  bminChromosomeGenes: Validators.compose([
    Validators.pattern(Regex.POSITIVE_INT),
  ]),
  bminChromosomeLength: Validators.compose([
    Validators.pattern(Regex.POSITIVE_INT),
  ]),
};


export const blockParamParsers = {
  bintermediate: parseInt,
  bmask: parseInt,
  bmatched: parseInt,
  bminChromosomeGenes: parseInt,
  bminChromosomeLength: parseInt,
};
