// Angular + dependencies
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy,
  Output, ViewChild } from '@angular/core';
import { Observable, Subject, combineLatest } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';
// app
import { GCV } from '@gcv-assets/js/gcv';
import { saveFile } from '@gcv/core/utils';
import { Gene, Track } from '@gcv/gene/models';
import { ClusterMixin } from '@gcv/gene/models/mixins';
import { GeneService, MicroTracksService } from '@gcv/gene/services';
// component
import { microShim } from './micro.shim';


@Component({
  selector: 'micro',
  styleUrls: ['../golden-viewer.scss'],
  template: `
    <context-menu (saveImage)="saveImage()"></context-menu>
    <div class="viewer" #container></div>
  `,
})
export class MicroComponent implements AfterViewInit, OnDestroy {

  @Input() clusterID: number;
  @Input() options: any = {};
  @Output() plotClick = new EventEmitter();
  @Output() geneClick = new EventEmitter();
  @Output() nameClick = new EventEmitter();

  @ViewChild('container', {static: true}) container: ElementRef;

  private _destroy: Subject<boolean> = new Subject();
  private _viewer;

  constructor(private _geneService: GeneService,
              private _microTracksService: MicroTracksService) { }

  // Angular hooks

  ngAfterViewInit() {
    const queryGenes = this._geneService.getQueryGenes();
    const queryTracks =
      this._microTracksService.getSelectedClusterTracks(this.clusterID);
    const allTracks = this._microTracksService.getAllTracks();
    const genes = allTracks.pipe(
        map((tracks) => {
          const filter = (t) => (t as ClusterMixin).cluster == this.clusterID;
          return tracks.filter(filter);
        }),
        switchMap((tracks) => {
          return this._geneService.getGenesForTracks(tracks as Track[]);
        }),
      );
    // fetch own data because injected components don't have change detection
    combineLatest(queryGenes, queryTracks, allTracks, genes)
      .pipe(takeUntil(this._destroy))
      .subscribe(([queryGenes, queryTracks, allTracks, genes]) => {
        this._draw(queryGenes, queryTracks, allTracks, genes);
      });
  }

  ngOnDestroy() {
    this._destroy.next(true);
    this._destroy.complete();
    this._destroyViewer();
  }

  // public

  emitPlot(event, track, queryTracks) {
    this.plotClick.emit({event, track, queryTracks});
  }

  emitGene(gene, family, source) {
    this.geneClick.emit({gene, family, source});
  }

  emitName(track) {
    this.nameClick.emit({track});
  }

  saveImage(): void {
    if (this._viewer !== undefined) {
      saveFile('micro-synteny', this._viewer.xml(), 'image/svg+xml', 'svg');
    }
  }

  // private

  private _destroyViewer(): void {
    if (this._viewer !== undefined) {
      this._viewer.destroy();
    }
  }

  private _draw(queryGenes, queryTracks, tracks, genes): void {
    this._destroyViewer();
    const {data, bold, familySizes} =
      microShim(this.clusterID, queryTracks, tracks, genes);
    let options = {
        bold: bold,
        highlight: queryGenes.map((g) => g.name),
        selectiveColoring: familySizes,
        plotClick: (e, t, i) => this.emitPlot(e, tracks[i], queryTracks),
        geneClick: (t, g, i) => this.emitGene(g.name, g.family, t.source),
        nameClick: (t, i) => this.emitName(tracks[i])
      };
    options = Object.assign(options, this.options);
    this._viewer = new GCV.visualization.Micro(
        this.container.nativeElement,
        GCV.common.colors,
        data,
        options);
  }
}
