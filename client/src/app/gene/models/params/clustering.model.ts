// Angular
import { AbstractControl, Validators } from '@angular/forms';
// app
import { LINKAGES, Regex } from '@gcv/gene/constants';


export type ClusteringParams = {
  linkage: string,  // TODO: remove magic string
  threshold: number,
};


export const clusteringParamMembers = [
  'linkage',
  'threshold',
];


export const clusteringParamValidators = {
  linkage: Validators.compose([
    Validators.required,
    Validators.pattern(LINKAGES.map((l) => l.id).join('|')),
  ]),
  threshold: Validators.compose([
    Validators.required,
    Validators.pattern(Regex.POSITIVE_INT),
  ]),
};


export const clusteringParamParsers = {
  linkage: (s) => s,
  threshold: parseInt,
};
