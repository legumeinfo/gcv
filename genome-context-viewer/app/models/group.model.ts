import { Gene } from './gene.model';

export class Group {
  species_id: number;
  species_name: string;
  chromosome_id: number;
  chromosome_name: string;
  genes: Gene[];
  source?: string;  // Server ID
  id: number;  // unique
}
