export interface UrlQueryParams {
  neighbors: number;
  sources: string[];
  matched: number;
  intermediate: number;
  algorithm: string;  // AlignmentAlgorithm ID
  match: number;
  mismatch: number;
  gap: number;
  score: number;
  threshold: number;
  order: string;  // SortingAlgorithm ID
}
