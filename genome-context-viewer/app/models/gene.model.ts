export interface Gene {
  id: number;
  name: string;
  family: number;  // Family ID
  fmin: number;
  fmax: number;
  strand: number;
  source?: string;  // Server ID
  x?: number;
  y?: number;
}
