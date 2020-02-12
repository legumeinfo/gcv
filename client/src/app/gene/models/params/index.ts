import { AlignmentParams, alignmentParamMembers, alignmentParamParsers,
  alignmentParamValidators } from './alignment.model';
import { BlockParams, blockParamMembers, blockParamParsers,
  blockParamValidators } from './block.model';
import { ClusteringParams, clusteringParamMembers, clusteringParamParsers,
  clusteringParamValidators } from './clustering.model';
import { MacroFilterParams, macroFilterParamMembers, macroFilterParamParsers,
  macroFilterParamValidators } from './macro-filters.model';
import { MacroOrderParams, macroOrderParamMembers, macroOrderParamParsers,
  macroOrderParamValidators } from './macro-order.model';
import { MicroFilterParams, microFilterParamMembers, microFilterParamParsers,
  microFilterParamValidators } from './micro-filters.model';
import { MicroOrderParams, microOrderParamMembers, microOrderParamParsers,
  microOrderParamValidators } from './micro-order.model';
import { QueryParams, queryParamMembers, queryParamParsers,
  queryParamValidators } from './query.model';
import { SourceParams, sourceParamMembers, sourceParamParsers,
  sourceParamValidators } from './source.model';


export * from './alignment.model';
export * from './block.model';
export * from './clustering.model';
export * from './macro-filters.model';
export * from './macro-order.model';
export * from './micro-filters.model';
export * from './micro-order.model';
export * from './query.model';
export * from './source.model';


export type Params = AlignmentParams | BlockParams | ClusteringParams |
  MacroFilterParams | MacroOrderParams | MicroFilterParams | MicroOrderParams |
  QueryParams | SourceParams;


export const paramMembers = [
  ...alignmentParamMembers,
  ...blockParamMembers,
  ...clusteringParamMembers,
  ...macroFilterParamMembers,
  ...macroOrderParamMembers,
  ...microFilterParamMembers,
  ...microOrderParamMembers,
  ...queryParamMembers,
  ...sourceParamMembers,
];


export const paramValidators = {
  ...alignmentParamValidators,
  ...blockParamValidators,
  ...clusteringParamValidators,
  ...macroFilterParamValidators,
  ...macroOrderParamValidators,
  ...microFilterParamValidators,
  ...microOrderParamValidators,
  ...queryParamValidators,
  ...sourceParamValidators,
};


export const formControlConfigFactory = (members, values, validators) => {
  const reducer = (accumulator, key) => {
      const value = (key in values) ? values[key] : '';
      const control = [value];
      if (key in validators) {
        control.push(validators[key]);
      }
      accumulator[key] = control;
      return accumulator;
    };
  return members.reduce(reducer, {});
};


export const paramParsers: {[key: string]: Function} = {
  ...alignmentParamParsers,
  ...blockParamParsers,
  ...clusteringParamParsers,
  ...macroFilterParamParsers,
  ...macroOrderParamParsers,
  ...microFilterParamParsers,
  ...microOrderParamParsers,
  ...queryParamParsers,
  ...sourceParamParsers,
};


export const paramParser =
(params: {[key: string]: any}): {[key: string]: any} => {
  const reducer = (accumulator, [key, value]) => {
      if (key in paramParsers) {
        accumulator[key] = paramParsers[key](value);
      }
      return accumulator;
    };
  return Object.entries(params).reduce(reducer, {});
};
