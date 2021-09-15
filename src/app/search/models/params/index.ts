import { SourceParams, sourceParamMembers, sourceParamParsers,
  sourceParamValidators } from './source.model';


export * from './source.model';


export type Params = SourceParams;


export const paramMembers = [
  ...sourceParamMembers,
];


export const paramValidators = {
  ...sourceParamValidators,
};


export const paramParsers: {[key: string]: Function} = {
  ...sourceParamParsers,
};
