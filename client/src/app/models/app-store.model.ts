import { Group }          from './group.model';
import { MacroTracks }    from './macro-tracks.model';
import { MicroTracks }    from './micro-tracks.model';
import { UrlQueryParams } from './url-query-params.model';

export interface AppStore {
  plots: MicroTracks;
  selectedPlot: Group;
  macroTracks: MacroTracks;
  microTracks: MicroTracks;
  urlQueryParams: UrlQueryParams;
}
