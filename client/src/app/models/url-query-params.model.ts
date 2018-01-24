export class UrlQueryParams {
  // block params
  bmatched: number;
  bintermediate: number;
  bmask: number;
  // query params
  neighbors: number;
  sources: string[];
  matched: number;
  intermediate: number;
  // alignment params
  algorithm: string;  // AlignmentAlgorithm ID
  match: number;
  mismatch: number;
  gap: number;
  score: number;
  threshold: number;
  // clustering params
  alpha: number;
  kappa: number;
  minsup: number;
  minsize: number;
  // filters
  regexp: string;
  order: string;  // SortingAlgorithm ID
}
