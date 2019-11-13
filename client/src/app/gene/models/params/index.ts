import { AlignmentParams } from './alignment.model';
import { BlockParams } from './block.model';
import { ClusteringParams } from './clustering.model';
import { Params } from './params.model';
import { QueryParams } from './query.model';
import { SourceParams } from './source.model';

export const params: any[] = [
  AlignmentParams,
  BlockParams,
  ClusteringParams,
  QueryParams,
  SourceParams,
];

export * from './alignment.model';
export * from './block.model';
export * from './clustering.model';
export * from './params.model';
export * from './query.model';
export * from './source.model';

//export type Params = AlignmentParams | BlockParams | ClusteringParams |
//  QueryParams | SourceParams;
