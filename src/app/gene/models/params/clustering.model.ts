// Angular
import { AbstractControl, Validators } from '@angular/forms';
// app
import { LINKAGES, Regex } from '@gcv/gene/constants';


export type ClusteringParams = {
  linkage: string,  // TODO: remove magic string
  cthreshold: number,
};


export const clusteringParamMembers = [
  'linkage',
  'cthreshold',
];


export const clusteringParamValidators = {
  linkage: Validators.compose([
    Validators.required,
    Validators.pattern(LINKAGES.map((l) => l.id).join('|')),
  ]),
  cthreshold: Validators.compose([
    Validators.required,
    Validators.pattern(Regex.POSITIVE_INT),
  ]),
};


export const clusteringParamParsers = {
  linkage: (s) => s,
  cthreshold: parseInt,
};
