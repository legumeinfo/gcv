import { MacroTracks } from "../models/macro-tracks.model";

export const macroTracksSelector = () => {
  return (state) => state
    .map(([macroTracks, filteredMicroTracks, options]) => {
      if (macroTracks !== undefined && filteredMicroTracks.groups.length > 0) {
        const query = filteredMicroTracks.groups[0];
        const chrs = filteredMicroTracks.groups.reduce((l, g, i) => {
          if (i > 0) {
            l.push(g.chromosome_name);
          }
          return l;
        }, []);
        //const macro = Object.assign({}, macroTracks);
        const macro = new MacroTracks();
        macro.chromosome = macroTracks.chromosome;
        macro.length = macroTracks.length;
        macro.tracks = macroTracks.tracks.filter((t) => {
          return (chrs.indexOf(t.chromosome) !== -1 && options.filter) || !options.filter;
        });
        macro.tracks.sort((a, b) => {
          const aIdx = chrs.indexOf(a.chromosome);
          const bIdx = chrs.indexOf(b.chromosome);
          if (!options.order || (aIdx === -1 && bIdx === -1)) {
            return a.chromosome.localeCompare(b.chromosome);
          } else if (aIdx === -1 && bIdx !== -1) {
            return Infinity;
          } else if (aIdx !== -1 && bIdx === -1) {
            return -Infinity;
          }
          return aIdx - bIdx;
        });
        return macro;
      }
      return macroTracks;
    });
};
