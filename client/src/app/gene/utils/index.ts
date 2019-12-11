import { CustomRouterStateSerializer } from './custom-router-state-serializer.util';
import { instantiateAndPopulate } from './instantiate-and-populate.util';
import { regexpOr } from './regexp-or.util';

export const utils: any[] = [
  CustomRouterStateSerializer,
  instantiateAndPopulate,
  regexpOr,
];

export * from './custom-router-state-serializer.util';
export * from './instantiate-and-populate.util';
export * from './regexp-or.util';
