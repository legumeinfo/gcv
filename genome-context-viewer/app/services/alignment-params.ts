export class AlignmentParams {
  constructor(
    public algorithm: string,  // Alignment ID
    public match: number,
    public mismatch: number,
    public gap: number,
    public score: number,
    public threshold: number
  ) { }
}
