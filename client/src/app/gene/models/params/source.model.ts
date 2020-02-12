// Angular
import { AbstractControl, Validators } from '@angular/forms';
// App
import { AppConfig } from '@gcv/app.config';


export type SourceParams = {
  sources: string[],
};


export const sourceParamMembers = [
  'sources',
];


export const sourcesValidator = (sources: AbstractControl): {[key: string]: any} => {
  if (!sources || !sources.value || !sources.value.length) {
    return {invalidSources: {}};
  }
  const sourceIDs = AppConfig.SERVERS.map((s) => s.id);
  if (sources.value.every((s) => sourceIDs.indexOf(s.id))) {
    return null;
  }
  return {invalidSources: {sources: sources.value}};
}


export const sourceParamValidators = {
  sources: Validators.compose([
    Validators.required,
    sourcesValidator,
  ]),
};


export const sourceParamParsers = {
  // TODO: is there a way to make sure the param is always an array or string,
  // not either?
  sources: (s) => (Array.isArray(s)) ? s : s.split(','),
};
