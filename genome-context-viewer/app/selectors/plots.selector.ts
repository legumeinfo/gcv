import { MicroTracks } from '../models/micro-tracks.model';

export const plotsSelector = () => {
  return state => state
    .map(([microPlots, filteredMicroTracks]) => {
      if (filteredMicroTracks.groups.length > 0) {
        let ids = filteredMicroTracks.groups.map(g => g.id);
        let plots = Object.assign({}, microPlots);
        plots.groups = plots.groups.filter(g => {
          return ids.indexOf(g.id) != -1;
        });
        plots.groups.sort((a, b) => {
          return ids.indexOf(a.id) - ids.indexOf(b.id);
        });
        return plots;
      }
      return microPlots;
    });
};
