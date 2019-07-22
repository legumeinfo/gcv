// Angular
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
// store
import { Store } from "@ngrx/store";
import * as routerActions from "../store/actions/router.actions";
import * as fromRoot from "../store/reducers";
//import * as fromAlignedMicroTracks from "../store/reducers/aligned-micro-tracks.store";
import * as fromRouter from "../store/reducers/router.reducer";
// app
import { GCV } from "../../assets/js/gcv";
import { ALIGNMENT_ALGORITHMS } from "../algorithms";
import { AlignmentParams, Group, MicroTracks } from "../models";
import { AlignmentMixin, ClusterMixin } from "../models/mixins";

@Injectable()
export class AlignmentService {
  alignedMicroTracks: Observable<MicroTracks>;
  alignmentParams: Observable<AlignmentParams>;

  private algorithms = ALIGNMENT_ALGORITHMS;
  private algorithmIDs = this.algorithms.map((a) => a.id);

  constructor(private store: Store<fromRoot.State>) {
    // initialize observables
    //this.alignedMicroTracks = this.store.select(fromAlignedMicroTracks.getAlignedMicroTracks);
    this.alignmentParams = this.store.select(fromRouter.getMicroAlignmentParams);
  }

  updateParams(params: AlignmentParams): void {
    const path = [];
    const query = Object.assign({}, params);
    this.store.dispatch(new routerActions.Go({path, query}));
  }

  getPairwiseReference(track: Group): Observable<Group> {
    return Observable.create((observer) => {
      // create modifiable extension of the query track
      const reference = Object.assign({}, track);
      reference.genes = [];
      for (let i = 0; i < track.genes.length; i++) {
        const g = Object.create(track.genes[i]);
        g.x = i;
        g.y = 0;
        reference.genes.push(g);
      }
      // push the "aligned" query track to the store;
      observer.next(reference);
      observer.complete();
    });
  }

  getPairwiseAlignment(
    query: Group,
    tracks: MicroTracks,
    params: AlignmentParams
  ): Observable<MicroTracks> {
    return Observable.create((observer) => {
      // create modifiable extension of tracks
      let alignedTracks = new MicroTracks() as MicroTracks<{}, AlignmentMixin, AlignmentMixin>;
      alignedTracks.families = tracks.families;
      for (const group of tracks.groups) {
        alignedTracks.groups.push({
          ...group,
          genes: group.genes.map(g => Object.create(g)),
        } as Group<AlignmentMixin> & AlignmentMixin);
      }
      // get the alignment algorithm
      const algorithmID = this.algorithmIDs.indexOf(params.algorithm);
      const algorithm = this.algorithms[algorithmID].algorithm;
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
        ignore: ["+", "-"],
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
          delete g.score;
        }
      }
      // TODO: move to standalone filter
      alignedTracks.groups = alignedTracks.groups.filter((g, i) => {
        return i === 0 || g.score >= params.score;
      });
      // push the aligned tracks to the store;
      observer.next(alignedTracks);
      // complete the observable
      observer.complete();
    });
  }
}
