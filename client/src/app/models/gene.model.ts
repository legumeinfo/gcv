export class Gene {
  id: number;
  name: string;
  family: string;  // Family ID
  fmin: number;
  fmax: number;
  strand: number;
  source?: string;  // Server ID
}


export function isGene(instance: any): instance is Gene {
  const gene = <Gene>instance;
  return gene !== null &&
         typeof gene.id === "number" &&
         typeof gene.name === "string" &&
         typeof gene.family === "string" &&
         typeof gene.fmin === "number" &&
         typeof gene.fmax === "number" &&
         typeof gene.strand === "number" &&
         (gene.source === undefined || typeof gene.source === "string");
}
