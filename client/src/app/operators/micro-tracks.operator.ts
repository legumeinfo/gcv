// rxjs
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
// App
import { Family, Gene, MicroTracks } from "../models";

export const microTracksOperator = (options?: any) => {
  return (state): Observable<MicroTracks> => state.pipe(
    map(([tracks, ...filters]) => {
      let filteredTracks = tracks;
      if (filteredTracks !== undefined) {
        for (const f of filters) {
          filteredTracks = f.algorithm(filteredTracks, options);
        }
      }
      return filteredTracks;
    }));
};
