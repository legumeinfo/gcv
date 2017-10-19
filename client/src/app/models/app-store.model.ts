import { Family }         from './family.model';
import { Gene }           from './gene.model';
import { Group }          from './group.model';
import { MacroTracks }    from './macro-tracks.model';
import { MicroTracks }    from './micro-tracks.model';
import { UI }             from './ui.model';
import { UrlQueryParams } from './url-query-params.model';

export interface AppStore {
  plots: MicroTracks;
  selectedFamily: Family;
  selectedGene: Gene;
  selectedPlot: Group;
  selectedMicroTrack: Group;
  macroTracks: MacroTracks;
  microTracks: MicroTracks;
  ui: UI;
  urlQueryParams: UrlQueryParams;
}
