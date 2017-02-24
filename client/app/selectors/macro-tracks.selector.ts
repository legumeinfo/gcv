import { MacroTracks } from '../models/macro-tracks.model';

export const macroTracksSelector = () => {
  return state => state
    .map(([macroTracks, filteredMicroTracks]) => {
      if (macroTracks !== undefined && filteredMicroTracks.groups.length > 0) {
        let query = filteredMicroTracks.groups[0];
        let chrs = filteredMicroTracks.groups.reduce((l, g, i) => {
          if (i > 0 && g.source == query.source) l.push(g.chromosome_name);
          return l;
        }, []);
        let macro = Object.assign({}, macroTracks);
        macro.tracks = macro.tracks.filter(t => {
          return chrs.indexOf(t.chromosome) != -1;
        });
        macro.tracks.sort((a, b) => {
          return chrs.indexOf(a.chromosome) - chrs.indexOf(b.chromosome);
        });
        return macro;
      }
      return macroTracks;
    })
};
