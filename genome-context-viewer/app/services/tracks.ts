export class Family {
  id: number;
  name: string;
}

export class Gene {
  id: number;
  name: string;
  family: number;  // Family.id
  fmin: number;
  fmax: number;
  strand: number;
}

export class Group {
  species_id: number;
  species_name: string;
  chromosome_id: number;
  chromosome_name: string;
  genes: Gene[];
}

export class Tracks {
  families: Family[];
  groups: Group[];
}
