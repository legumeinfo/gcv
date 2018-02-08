// Angular
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Store }      from '@ngrx/store';

// App store
import { ALIGNMENT_ALGORITHMS } from '../constants/alignment-algorithms';
import { AlignmentParams }      from '../models/alignment-params.model';
import { AppRoutes }            from '../constants/app-routes';
import { AppRouteService }      from './app-route.service';
import { AppStore }             from '../models/app-store.model';
import { argsByValue }          from '../decorators/args-by-value.decorator';
import { GCV }                  from '../../assets/js/gcv';
import { MicroTracks }          from '../models/micro-tracks.model';
import { StoreActions }         from '../constants/store-actions';

@Injectable()
export class AlignmentService extends AppRouteService {
  alignmentParams: Observable<AlignmentParams>;
  alignedMicroTracks: Observable<AlignmentParams>;

  private _algorithms   = ALIGNMENT_ALGORITHMS;
  private _algorithmIDs = this._algorithms.map(a => a.id);

  constructor(private _store: Store<AppStore>) {
    super(_store);

    // initialize observables
    this.alignmentParams     = this._store.select('alignmentParams')
    this.alignedMicroTracks  = this._store.select('alignedMicroTracks');
    let microTracks          = this._store.select<MicroTracks>('microTracks');
    let clusteredMicroTracks = this._store.select<MicroTracks>('clusteredMicroTracks');

    // subscribe to changes that trigger new pairwise alignments
    Observable
      .combineLatest(microTracks, this.alignmentParams)
      .filter(([tracks, params]) => this._route == AppRoutes.SEARCH)
      .subscribe(([tracks, params]) => this._alignTracks(tracks, params));

    // subscribe to changes that trigger new multi alignments
    clusteredMicroTracks
      .filter(tracks => this._route == AppRoutes.MULTI)
      .subscribe(tracks => this._multiAlignTracks(tracks));
  }

  @argsByValue()
  private _alignTracks(tracks: MicroTracks, params: AlignmentParams): void {
    // get the alignment algorithm
    let algorithmID = this._algorithmIDs.indexOf(params.algorithm),
        algorithm   = this._algorithms[algorithmID].algorithm;
    // get the query and the algorithm options
    let query = tracks.groups[0];
    let options = Object.assign({}, {
      accessor: g => (g.strand == -1 ? '-' : '+') + g.family,
      reverse: s => {
        let r = JSON.parse(JSON.stringify(s));
        r.reverse();
        r.forEach(g => g.strand *= -1);
        return r;
      },
      suffixScores: true,
      scores: Object.assign({}, params)
    });
    // perform the alginments
    let alignments = [];
    for (let i = 1; i < tracks.groups.length; ++i) {
      let result = tracks.groups[i];
      let al = algorithm(query.genes, result.genes, options);
      let id = result.id;
      // save tracks that meet the threshold
      for (let j = 0; j < al.length; ++j) {
        let a = al[j];
        if (a.score >= options.scores.threshold) {
          a.track = Object.assign({}, result);
          alignments.push(a);
        }
      }
    }
    // convert the alignments into tracks
    tracks = GCV.alignment.trackify(tracks, alignments);
    // merge tracks from same alignment set remove residual suffix scores
    tracks = GCV.alignment.merge(tracks);
    for (let i = 1; i < tracks.groups.length; ++i) {
      let genes = tracks.groups[i].genes;
      for (let j = 0; j < genes.length; ++j) {
        delete genes[j].suffixScore;
      }
    }
    // TODO: move to standalone filter
    tracks.groups = tracks.groups.filter((g, i) => {
      return i == 0 || g.score >= params.score;
    });
    // push the aligned tracks to the store
    let action = {type: StoreActions.NEW_ALIGNED_TRACKS, payload: tracks};
    this._store.dispatch(action);
  }

  @argsByValue()
  private _multiAlignTracks(tracks: MicroTracks): void {
    // bin tracks by their clusters
    let clusters = {};
    for (let i = 0; i < tracks.groups.length; i++) {
      let cluster = tracks.groups[i].cluster;
      if (!clusters.hasOwnProperty(cluster)) {
        clusters[cluster] = [];
      }
      clusters[cluster].push(tracks.groups[i]);
    }
    // perform a multiple alignment on each of the clusters
    let alignedTracks = [];
    Object.keys(clusters).forEach((cluster, index) => {
      if (cluster === 'undefined') {
        alignedTracks = alignedTracks.concat(clusters[cluster]);
      } else {
        let alignedCluster = GCV.alignment.msa(clusters[cluster]);
        alignedTracks      = alignedTracks.concat(alignedCluster);
      }
    });
    tracks.groups = alignedTracks;
    // push the aligned tracks to the store
    let action = {type: StoreActions.NEW_ALIGNED_TRACKS, payload: tracks};
    this._store.dispatch(action);
  }

  @argsByValue()
  updateParams(params: AlignmentParams): void {
    let action = {type: StoreActions.UPDATE_ALIGNMENT_PARAMS, payload: params};
    this._store.dispatch(action);
  }
}
