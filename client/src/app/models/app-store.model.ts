// Angular + dependencies
//import { BehaviorSubject } from 'rxjs/BehaviorSubject';

// App
import { AlignmentParams }  from './alignment-params.model';
import { BlockParams }      from './block-params.model';
import { ClusteringParams } from './clustering-params.model';
import { Group }            from './group.model';
import { MacroTracks }      from './macro-tracks.model';
import { MicroTracks }      from './micro-tracks.model';
import { QueryParams }      from './query-params.model';
import { UrlQueryParams }   from './url-query-params.model';

export interface AppStore {
  alignedMicroTracks: MicroTracks;
  alignmentParams: AlignmentParams;
  blockParams: BlockParams;
  clusteredMicroTracks: MicroTracks;
  clusteringParams: ClusteringParams;
  macroChromosome: any;
  macroTracks: MacroTracks;
  microTracks: MicroTracks;
  multiQueryGenes: Array<string>;
  plots: MicroTracks;
  queryParams: QueryParams;
  route: string;
  searchQueryGene: any;
  searchQueryTrack: Group;
  selectedPlot: Group;
  urlQueryParams: UrlQueryParams;
}


//export class AppStore extends BehaviorSubject {
//  alignedMicroTracks: MicroTracks;
//  alignmentParams: AlignmentParams;
//  blockParams: BlockParams;
//  clusteredMicroTracks: MicroTracks;
//  clusteringParams: ClusteringParams;
//  macroChromosome: any;
//  macroTracks: MacroTracks;
//  microTracks: MicroTracks;
//  multiQueryGenes: Array<string>;
//  plots: MicroTracks;
//  queryParams: QueryParams;
//  searchQueryGene: any;
//  searchQueryTrack: Group;
//  selectedPlot: Group;
//  urlQueryParams: UrlQueryParams;
//
//  constructor(private _dispatcher,
//              private _reducer,
//              preMiddleware,
//              postMiddleware,
//              initialState = {}) {
//    super(initialState);
//    this._dispatcher
//      .let(preMiddleware)
//      .scan((state, action) => this._reducer(state, action), initialState)
//      .let(postMiddleware)
//      .subscribe(state => super.next(state));
//  }
//
//  //Map makes it easy to select slices of state that will be needed for your components
//  //This is a simple helper function to make grabbing sections of state more concise
//  //select(key : string) {
//  //  return this.map(state => state[key]);
//  //}
//
//  //...store implementation
//}
