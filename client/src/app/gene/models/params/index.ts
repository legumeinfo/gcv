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
