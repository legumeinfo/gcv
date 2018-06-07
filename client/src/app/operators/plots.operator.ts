// rxjs
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
// App
import { Group } from "../models";

export const plotsOperator = () => {
  return (state): Observable<Group> => state.pipe(
    map(([microPlots, filteredMicroTracks]) => {
      if (filteredMicroTracks.groups.length > 0) {
        const ids = filteredMicroTracks.groups.map((g) => g.id);
        const plots = microPlots.filter((p) => {
          return ids.indexOf(p.id) !== -1;
        });
        plots.sort((a, b) => {
          return ids.indexOf(a.id) - ids.indexOf(b.id);
        });
        return plots;
      }
      return microPlots;
    }));
};
