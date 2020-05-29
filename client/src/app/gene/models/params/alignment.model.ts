// Angular
import { Validators } from '@angular/forms';
// app
import { ALIGNMENT_ALGORITHMS } from '@gcv/gene/algorithms/alignment.algorithm';
import { Regex } from '@gcv/gene/constants';


export type AlignmentParams = {
  algorithm: string,  // Algorithm ID
  match: number,
  mismatch: number,
  gap: number,
  score: number,
  threshold: number,
};


export const alignmentParamMembers = [
  'algorithm',
  'match',
  'mismatch',
  'gap',
  'score',
  'threshold',
];


export const alignmentParamValidators = {
  algorithm: Validators.compose([
    Validators.required,
    Validators.pattern(ALIGNMENT_ALGORITHMS.map((a) => a.id).join('|')),
  ]),
  gap: Validators.compose([
    Validators.required,
    Validators.pattern(Regex.NEGATIVE_INT),
  ]),
  match: Validators.compose([
    Validators.required,
    Validators.pattern(Regex.POSITIVE_INT),
  ]),
  mismatch: Validators.compose([
    Validators.required,
    Validators.pattern(Regex.NEGATIVE_INT),
  ]),
  score: Validators.compose([
    Validators.required,
    Validators.pattern(Regex.POSITIVE_INT),
  ]),
  threshold: Validators.compose([
    Validators.required,
    Validators.pattern(Regex.POSITIVE_INT),
  ]),
};


export const alignmentParamParsers = {
  algorithm: (s) => s,
  gap: parseInt,
  match: parseInt,
  mismatch: parseInt,
  score: parseInt,
  threshold: parseInt,
};
