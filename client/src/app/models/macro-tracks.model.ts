import { MacroTrack } from "./macro-track.model";

export class MacroTracks {
  chromosome: string;
  length: number;
  tracks: MacroTrack[];
  genus?: string;
  species?: string;
  source?: string;
}
