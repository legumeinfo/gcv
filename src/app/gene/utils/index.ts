import { getMacroColors } from './get-macro-colors.util';
import { instantiateAndPopulate } from './instantiate-and-populate.util';
import { regexpOr } from './regexp-or.util';


export const utils: any[] = [
  getMacroColors,
  instantiateAndPopulate,
  regexpOr,
];


export * from './get-macro-colors.util';
export * from './instantiate-and-populate.util';
export * from './regexp-or.util';
