export interface Gene {
  id: number;
  name: string;
  family: number;  // Family.id
  fmin: number;
  fmax: number;
  strand: number;
}
