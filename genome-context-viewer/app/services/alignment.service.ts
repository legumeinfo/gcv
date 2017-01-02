// Angular
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Store }      from '@ngrx/store';

// App store
import { ADD_ALIGNED_MICRO_TRACKS,
         ADD_ALIGNMENT_PARAMS } from '../constants/actions';
import { ALIGNMENT_ALGORITHMS } from '../constants/alignment-algorithms';
import { AlignmentParams }      from '../models/alignment-params.model';
import { AppStore }             from '../models/app-store.model';
import { MicroTracks }          from '../models/micro-tracks.model';

declare var Alignment: any;
declare var GCV: any;

@Injectable()
export class AlignmentService {
  tracks: Observable<MicroTracks>;

  private _algorithms = ALIGNMENT_ALGORITHMS;
  private _algorithmIDs = this._algorithms.map(a => a.id);

  constructor(private _store: Store<AppStore>) {
    this._init();
  }

  private _init(): void {
    this.tracks = Observable.combineLatest(
      this._store.select('microTracks'),
      this._store.select('alignmentParams')
    ).let(this._alignTracks());
  }

  private _alignTracks = () => {
    return state => state.map(([tracks, params]) => {
      let algorithm = this._algorithms[this._algorithmIDs.indexOf(
        params.algorithm
      )].algorithm;
      let query = tracks.groups[0];
      let options = Object.assign({}, params, {
        accessor: g => g.family,
        suffixScores: true
      });
      let alignments = [];
      let scores = {};
      for (let i = 1; i < tracks.groups.length; ++i) {
        let result = tracks.groups[i];
        let al = algorithm(query.genes, result.genes, options);
        let id = result.id;
        // save tracks that meet the threshold
        for (let j = 0; j < al.length; ++j) {
          let a = al[j];
          if (a.score >= options.threshold) {
            a.track = Object.assign({}, result);
            alignments.push(a);
            scores[id] = (scores[id] || 0) + a.score;
          }
        }
      }
      // convert the alignments into tracks
      let alignedTracks = Alignment.trackify(tracks, alignments);
      // merge tracks from same alignment set remove residual suffix scores
      var mergedTracks = GCV.merge(alignedTracks);
      for (let i = 1; i < mergedTracks.groups.length; ++i) {
        let genes = mergedTracks.groups[i].genes;
        for (let j = 0; j < genes.length; ++j) {
          delete genes[j].suffixScore;
        }
      }
      // TODO: move to standalone filter
      mergedTracks.groups = mergedTracks.groups.filter((g, i) => {
        return i == 0 || g.score >= params.score;
      });
      return mergedTracks;
    });
  }

  updateParams(params: AlignmentParams): void {
    this._store.dispatch({type: ADD_ALIGNMENT_PARAMS, payload: params});
	}
}
