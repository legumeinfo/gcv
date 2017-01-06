export class Gene {
  id: number;
  name: string;
  family: string;  // Family ID
  fmin: number;
  fmax: number;
  strand: number;
  source?: string;  // Server ID
  x?: number;
  y?: number;
}
