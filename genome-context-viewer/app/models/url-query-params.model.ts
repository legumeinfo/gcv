export class UrlQueryParams {
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
  // filters
  regexp: string;
  order: string;  // SortingAlgorithm ID
}
