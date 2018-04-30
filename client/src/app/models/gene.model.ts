export class Gene {
  id: number;
  name: string;
  family: string;  // Family ID
  fmin: number;
  fmax: number;
  strand: number;
  // TODO: introduce options as mixims
  source?: string;  // Server ID
  x?: number;
  y?: number;
  suffixScore?: number;
}
