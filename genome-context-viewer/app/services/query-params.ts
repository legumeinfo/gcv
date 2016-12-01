export class QueryParams {
  constructor(
    public neighbors: number,
    public sources: string[],  // Server IDs
    public matched?: number,
    public intermediate?: number
  ) { }

  toUrlSafe(): any {
    var params = {neighbors: this.neighbors};
    if (this.sources.length > 0)
      params['sources'] = this.sources;
    if (this.matched !== undefined)
      params['matched'] = this.matched;
    if (this.intermediate !== undefined)
      params['intermediate'] = this.intermediate;
    return params;
  }
}
