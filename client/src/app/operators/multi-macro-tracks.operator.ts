// rxjs
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
// App
import { MacroTracks } from "../models";

export const multiMacroTracksOperator = () => {
  return (state): Observable<MacroTracks[]> => state.pipe(
    map(([multiMacroTracks, filteredMicroTracks]) => {
      if (multiMacroTracks !== undefined && filteredMicroTracks.groups.length > 0) {
        const chromosomes = new Set(filteredMicroTracks.groups.map((g) => g.chromosome_name));
        const filteredMultiMacroTracks = multiMacroTracks.filter((track) => {
          return chromosomes.has(track.chromosome);
        });
        return filteredMultiMacroTracks;
      }
      return multiMacroTracks;
    }));
};
