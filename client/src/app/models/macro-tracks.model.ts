import { MacroTrack } from "./macro-track.model";

export interface MacroTracks {
  chromosome: string;
  length: number;
  tracks: MacroTrack[];
}
