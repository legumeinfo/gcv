export type Result = {
  genes?: string[];  // list of gene IDs
  regions?: {gene: string, neighbors: number}[];
}
