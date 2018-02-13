// Angular
import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
// import { Store }      from "@ngrx/store";

// App store
import { GCV } from "../../assets/js/gcv";
import { ALIGNMENT_ALGORITHMS } from "../constants/alignment-algorithms";
import { AppRoutes } from "../constants/app-routes";
import { StoreActions } from "../constants/store-actions";
import { argsByValue } from "../decorators/args-by-value.decorator";
import { AlignmentParams } from "../models/alignment-params.model";
import { AppStore } from "../models/app-store.model";
import { MicroTracks } from "../models/micro-tracks.model";
import { AppRouteService } from "./app-route.service";

@Injectable()
export class AlignmentService extends AppRouteService {
  alignmentParams: Observable<AlignmentParams>;
  alignedMicroTracks: Observable<MicroTracks>;

  private algorithms   = ALIGNMENT_ALGORITHMS;
  private algorithmIDs = this.algorithms.map((a) => a.id);

  constructor(/*private _store: Store<AppStore>*/) {
    // super(_store);
    super();

    // initialize observables
    // this.alignmentParams     = this._store.select("alignmentParams");
    // this.alignedMicroTracks  = this._store.select("alignedMicroTracks");
    // let microTracks          = this._store.select<MicroTracks>("microTracks");
    // let clusteredMicroTracks = this._store.select<MicroTracks>("clusteredMicroTracks");
    this.alignmentParams = Observable.empty<AlignmentParams>();
    this.alignedMicroTracks = Observable.empty<MicroTracks>();
    const microTracks = Observable.empty<MicroTracks>();
    const clusteredMicroTracks = Observable.empty<MicroTracks>();

    // subscribe to changes that trigger new pairwise alignments
    Observable
      .combineLatest(microTracks, this.alignmentParams)
      .filter(([tracks, params]) => this.route === AppRoutes.SEARCH)
      .subscribe(([tracks, params]) => this._alignTracks(tracks, params));

    // subscribe to changes that trigger new multi alignments
    clusteredMicroTracks
      .filter((tracks) => this.route === AppRoutes.MULTI)
      .subscribe((tracks) => this._multiAlignTracks(tracks));
  }

  @argsByValue()
  updateParams(params: AlignmentParams): void {
    // let action = {type: StoreActions.UPDATE_ALIGNMENT_PARAMS, payload: params};
    // this._store.dispatch(action);
  }

  @argsByValue()
  private _alignTracks(tracks: MicroTracks, params: AlignmentParams): void {
    // get the alignment algorithm
    const algorithmID = this.algorithmIDs.indexOf(params.algorithm);
    const algorithm   = this.algorithms[algorithmID].algorithm;
    // get the query and the algorithm options
    const query = tracks.groups[0];
    const options = Object.assign({}, {
      accessor: (g) => (g.strand === -1 ? "-" : "+") + g.family,
      reverse: (s) => {
        const r = JSON.parse(JSON.stringify(s));
        r.reverse();
        r.forEach((g) => g.strand *= -1);
        return r;
      },
      scores: Object.assign({}, params),
      suffixScores: true,
    });
    // perform the alginments
    const alignments = [];
    for (let i = 1; i < tracks.groups.length; ++i) {
      const result = tracks.groups[i];
      const al = algorithm(query.genes, result.genes, options);
      const id = result.id;
      // save tracks that meet the threshold
      for (const a of al) {
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
      const genes = tracks.groups[i].genes;
      for (const g of genes) {
        delete g.suffixScore;
      }
    }
    // TODO: move to standalone filter
    tracks.groups = tracks.groups.filter((g, i) => {
      return i === 0 || g.score >= params.score;
    });
    // push the aligned tracks to the store
    // let action = {type: StoreActions.NEW_ALIGNED_TRACKS, payload: tracks};
    // this._store.dispatch(action);
  }

  @argsByValue()
  private _multiAlignTracks(tracks: MicroTracks): void {
    // bin tracks by their clusters
    const clusters = {};
    for (const group of tracks.groups) {
      const cluster = group.cluster;
      if (!clusters.hasOwnProperty(cluster)) {
        clusters[cluster] = [];
      }
      clusters[cluster].push(group);
    }
    // perform a multiple alignment on each of the clusters
    let alignedTracks = [];
    Object.keys(clusters).forEach((cluster, index) => {
      if (cluster === "undefined") {
        alignedTracks = alignedTracks.concat(clusters[cluster]);
      } else {
        const alignedCluster = GCV.alignment.msa(clusters[cluster]);
        alignedTracks = alignedTracks.concat(alignedCluster);
      }
    });
    tracks.groups = alignedTracks;
    // push the aligned tracks to the store
    // let action = {type: StoreActions.NEW_ALIGNED_TRACKS, payload: tracks};
    // this._store.dispatch(action);
  }
}
