// Angular
import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, firstValueFrom } from 'rxjs';
import { map, shareReplay, switchMap } from 'rxjs/operators';
// store
import { geneID } from '@gcv/gene/store/reducers/gene.reducer';
// app
import { clusterAlignments } from '@gcv/gene/alignment';
import { Annotation } from '@gcv/gene/annotations/grammar';
import {
  AnnotatedCluster,
  Resolution,
  resolveAnnotations,
} from '@gcv/gene/annotations/resolve';
import { microShim } from '@gcv/gene/components/viewers/micro/micro.shim';
import { FamilyService } from './family.service';
import { GeneService } from './gene.service';
import { MicroTracksService } from './micro-tracks.service';
import { ParamsService } from './params.service';

// The URL's annotations placed on the view's clusters, as the viewers draw
// them, with a reason for each one that can't be placed. Placing needs every
// cluster, since an anchor gene can be in several.
@Injectable()
export class AnnotationService {
  private _familyService = inject(FamilyService);
  private _geneService = inject(GeneService);
  private _microTracksService = inject(MicroTracksService);
  private _paramsService = inject(ParamsService);

  private _clusters: Observable<AnnotatedCluster[]>;
  private _resolution: Observable<Resolution>;

  // the URL's annotations, placed
  getResolution(): Observable<Resolution> {
    this._resolution ??= combineLatest([
      this._paramsService.getAnnotationListParams(),
      this._annotatedClusters(),
    ]).pipe(
      map(([{ annot }, clusters]) => resolveAnnotations(annot.items, clusters)),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    return this._resolution;
  }

  // annotations not in the URL, placed on the view as it is now
  resolve(annotations: Annotation[]): Promise<Resolution> {
    return firstValueFrom(
      this._annotatedClusters().pipe(
        map((clusters) => resolveAnnotations(annotations, clusters)),
      ),
    );
  }

  // the view's clusters as drawn and aligned
  private _annotatedClusters(): Observable<AnnotatedCluster[]> {
    const tracks = this._microTracksService.getAllTracks();
    this._clusters ??= combineLatest([
      this._microTracksService.getQueryAlignment(),
      tracks,
      tracks.pipe(switchMap((t) => this._geneService.getGenesForTracks(t))),
      this._familyService.selectOmittedFamilies(),
    ]).pipe(
      map(([query, all, genes, omitted]) => {
        const geneMap = new Map(
          genes.map((g) => [geneID(g.name, g.source), g]),
        );
        const queries = new Set(query.tracks);
        const ids = Array.from(new Set(all.map((t) => t.cluster))).sort(
          (a, b) => a - b,
        );
        return ids.map((id) => {
          const [alignment] = clusterAlignments(
            query.consensuses,
            all.filter((t) => t.cluster === id),
            queries,
            geneMap,
          );
          const { data } = microShim(id, query.tracks, all, genes, omitted);
          return { alignment, drawn: data };
        });
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    return this._clusters;
  }
}
