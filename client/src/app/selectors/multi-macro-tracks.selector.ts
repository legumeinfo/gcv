import { Observable } from "rxjs/Observable";
import { MacroTracks } from "../models/macro-tracks.model";

export const multiMacroTracksSelector = () => {
  return (state): Observable<MacroTracks[]> => state
    .map(([multiMacroTracks, filteredMicroTracks]) => {
      if (multiMacroTracks !== undefined && filteredMicroTracks.groups.length > 0) {
        const chromosomes = new Set(filteredMicroTracks.groups.map((g) => g.chromosome_name));
        const filteredMultiMacroTracks = multiMacroTracks.filter((track) => {
          return chromosomes.has(track.chromosome);
        });
        return filteredMultiMacroTracks;
      }
      return multiMacroTracks;
    });
};
