// Angular
import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
// store
import { Store } from "@ngrx/store";
import * as alignedMicroTracksActions from "../actions/aligned-micro-tracks.actions";
import * as fromRoot from "../reducers";
import * as fromAlignedMicroTracks from "../reducers/aligned-micro-tracks.store";
import * as fromAlignmentParams from "../reducers/alignment-params.store";
import * as fromClusteredMicroTracks from "../reducers/clustered-micro-tracks.store";
import * as fromMicroTracks from "../reducers/micro-tracks.store";
import * as fromRouter from "../reducers/router.store";
import * as fromSearchQueryTrack from "../reducers/search-query-track.store";
// app
import { GCV } from "../../assets/js/gcv";
import { ALIGNMENT_ALGORITHMS } from "../constants/alignment-algorithms";
import { AppRoutes } from "../constants/app-routes";
import { AlignmentParams } from "../models/alignment-params.model";
import { Group } from "../models/group.model";
import { MicroTracks } from "../models/micro-tracks.model";

@Injectable()
export class AlignmentService {
  alignedMicroTracks: Observable<MicroTracks>;
  alignmentParams: Observable<AlignmentParams>;

  private algorithms = ALIGNMENT_ALGORITHMS;
  private algorithmIDs = this.algorithms.map((a) => a.id);

  constructor(private store: Store<fromRoot.State>) {
    // initialize observables
    this.alignedMicroTracks = this.store.select(fromAlignedMicroTracks.getAlignedMicroTracks);
    this.alignmentParams = this.store.select(fromAlignmentParams.getAlignmentParams);
    const clusteredMicroTracks = this.store.select(fromClusteredMicroTracks.getClusteredMicroTracks);
    const microTracks = this.store.select(fromMicroTracks.getMicroTracks);
    const newMicroTracks = this.store.select(fromMicroTracks.getNewMicroTracks);
    const searchQueryTrack = this.store.select(fromSearchQueryTrack.getSearchQueryTrack)
      .filter((queryTrack) => queryTrack !== undefined);
    const routeParams = this.store.select(fromRouter.getParams);

    // subscribe to changes that trigger new pairwise alignments
    searchQueryTrack
      .subscribe((queryTrack) => {
        this._newPairwiseAlignment(queryTrack);
      });

    this.alignmentParams
      .withLatestFrom(searchQueryTrack, microTracks)
      .subscribe(([params, queryTrack, microTracks]) => {
        this._newPairwiseAlignment(queryTrack);
        this._pairwiseAlignment(queryTrack, microTracks, params);
      });

    // align new micro tracks as they come into the store
    newMicroTracks
      .withLatestFrom(searchQueryTrack, this.alignmentParams, routeParams)
      .filter(([microTracks, queryTrack, params, route]) => {
        return route.gene !== undefined;
      })
      .subscribe(([microTracks, queryTrack, params]) => {
        this._pairwiseAlignment(queryTrack, microTracks, params);
      });

    // subscribe to changes that trigger new multi alignments
    clusteredMicroTracks
      .subscribe((microTracks) => {
        this._multipleAlignment(microTracks);
      });
  }

  updateParams(params: AlignmentParams): void {
    // let action = {type: StoreActions.UPDATE_ALIGNMENT_PARAMS, payload: params};
    // this._store.dispatch(action);
  }

  private _newPairwiseAlignment(queryTrack: Group): void {
    // create modifiable copy of the query track
    const reference = Object.assign({}, queryTrack);
    reference.genes = [];
    for (let i = 0; i < queryTrack.genes.length; i++) {
      const g = Object.create(queryTrack.genes[i]);
      g.x = i;
      g.y = 0;
      reference.genes.push(g);
    }
    // push the "aligned" query track to the store;
    this.store.dispatch(new alignedMicroTracksActions.New(reference));
  }

  // TODO: pass query track as parameter instead of assuming first track is query
  private _pairwiseAlignment(
    query: Group,
    tracks: MicroTracks,
    params: AlignmentParams
  ): void {
    // create modifiable copy of tracks
    let alignedTracks = new MicroTracks();
    alignedTracks.families = tracks.families;
    for (const group of tracks.groups) {
      let newGroup = Object.assign({}, group);
      newGroup.genes = group.genes.map(g => Object.create(g));
      alignedTracks.groups.push(newGroup);
    }
    // get the alignment algorithm
    const algorithmID = this.algorithmIDs.indexOf(params.algorithm);
    const algorithm   = this.algorithms[algorithmID].algorithm;
    // get the algorithm options
    const options = Object.assign({}, {
      accessor: (g) => {
        if (g.reversed) {
          return (g.strand === -1 ? "+" : "-") + g.family;
        }
        return (g.strand === -1 ? "-" : "+") + g.family;
      },
      reverse: (s) => {
        const r = [];
        for (const g of s) {
          const g2 = Object.create(Object.getPrototypeOf(g));
          g2.reversed = true;
          r.push(g2);
        }
        r.reverse();
        return r;
      },
      scores: Object.assign({}, params),
      suffixScores: true,
    });
    // perform the alginments
    const alignments = [];
    for (let i = 0; i < alignedTracks.groups.length; ++i) {
      const result = alignedTracks.groups[i];
      const al = algorithm(query.genes, result.genes, options);
      // save tracks that meet the threshold
      for (const a of al) {
        if (a.score >= options.scores.threshold) {
          a.track = Object.assign({}, result);
          alignments.push(a);
        }
      }
    }
    // convert the alignments into tracks
    alignedTracks = GCV.alignment.trackify(query, alignedTracks, alignments);
    // merge tracks from same alignment set and remove residual suffix scores
    alignedTracks = GCV.alignment.merge(alignedTracks);
    for (let i = 1; i < alignedTracks.groups.length; ++i) {
      const genes = alignedTracks.groups[i].genes;
      for (const g of genes) {
        delete g.suffixScore;
      }
    }
    // TODO: move to standalone filter
    alignedTracks.groups = alignedTracks.groups.filter((g, i) => {
      return i === 0 || g.score >= params.score;
    });
    // push the aligned tracks to the store;
    this.store.dispatch(new alignedMicroTracksActions.Add(alignedTracks));
  }

  private _multipleAlignment(tracks: MicroTracks): void {
    // create modifiable copy of tracks
    let alignedTracks = new MicroTracks();
    alignedTracks.families = tracks.families;
    for (const group of tracks.groups) {
      let newGroup = Object.assign({}, group);
      newGroup.genes = group.genes.map(g => Object.create(g));
      alignedTracks.groups.push(newGroup);
    }
    // bin tracks by their clusters
    const clusters = {};
    for (const group of alignedTracks.groups) {
      const cluster = group.cluster;
      if (!clusters.hasOwnProperty(cluster)) {
        clusters[cluster] = [];
      }
      clusters[cluster].push(group);
    }
    // perform a multiple alignment on each of the clusters
    let alignedGroups = [];
    Object.keys(clusters).forEach((cluster, index) => {
      if (cluster === "undefined") {
        alignedGroups = alignedGroups.concat(clusters[cluster]);
      } else {
        const alignedCluster = GCV.alignment.msa(clusters[cluster]);
        alignedGroups = alignedGroups.concat(alignedCluster);
      }
    });
    alignedTracks.groups = alignedGroups;
    // push the aligned tracks to the store
    this.store.dispatch(new alignedMicroTracksActions.Add(alignedTracks));
  }
}
