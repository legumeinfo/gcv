// Angular + dependencies
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy,
  OnInit, Output, ViewChild } from '@angular/core';
import { Observable, Subject, combineLatest } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';
// app
import { GCV } from '@gcv-assets/js/gcv';
import { saveFile } from '@gcv/core/utils';
import { Gene, Track, Pipeline } from '@gcv/gene/models';
import { AlignmentMixin, ClusterMixin } from '@gcv/gene/models/mixins';
import { GeneService, MicroTracksService, ProcessService }
  from '@gcv/gene/services';
// component
import { microShim } from './micro.shim';


@Component({
  selector: 'gcv-micro',
  styleUrls: ['../golden-viewer.scss'],
  template: `
    <gcv-context-menu (saveImage)="saveImage()">
      <ul class="navbar-nav mr-auto">
        <li *ngIf="showMacro()" class="nav-item dropdown">
          <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            Macro Viewers
          </a>
          <div *ngIf="queryTracks|async as tracks" class="dropdown-menu" aria-labelledby="navbarDropdown">
            <div *ngIf="showCircos()">
              <h6 class="dropdown-header">Multi</h6>
              <a [routerLink]="" queryParamsHandling="preserve" class="dropdown-item" (click)="emitCircos(tracks)">Circos</a>
            </div>
            <div *ngIf="showCircos() && showReference()" class="dropdown-divider"></div>
            <div *ngIf="showReference()">
              <h6 class="dropdown-header">Reference</h6>
              <a [routerLink]="" queryParamsHandling="preserve" *ngFor="let track of tracks" class="dropdown-item" (click)="emitReference(track)">{{ track.name }}</a>
            </div>
          </div>
        </li>
      </ul>
      <gcv-pipeline [info]=info [pipeline]=pipeline navcenter></gcv-pipeline>
    </gcv-context-menu>
    <div (gcvOnResize)="draw()" class="viewer" #container></div>
  `,
})
export class MicroComponent implements AfterViewInit, OnDestroy, OnInit {

  @Input() clusterID: number;
  @Input() options: any = {};
  // viewer
  @Output() plotClick = new EventEmitter();
  @Output() geneClick = new EventEmitter();
  @Output() geneOver = new EventEmitter();
  @Output() nameClick = new EventEmitter();
  // context menu
  @Output() circos = new EventEmitter();
  @Output() reference = new EventEmitter();

  @ViewChild('container', {static: true}) container: ElementRef;

  draw = () => { /* no-op */ };

  private _destroy: Subject<boolean> = new Subject();
  private _viewer;

  info = `<p>This is the micro synteny <i>pipeline</i>.
          It depicts the flow of data from one <i>process</i> to the next for
          <u>this</u> micro synteny viewer.</p>
          <p class="mb-0">
          <b>Track Search</b> searches for micro tracks similar to the query
          tracks in this viewer.
          <br>
          <b>Track Alignment</b> aligns the search result tracks to the query
          tracks.
          <br>
          <b>Track Genes</b> fetches the genes for all the tracks in the viewer.
          </p>`;
  pipeline: Pipeline;

  queryTracks: Observable<(Track & ClusterMixin & AlignmentMixin)[]>;

  constructor(private _geneService: GeneService,
              private _microTracksService: MicroTracksService,
              private _processService: ProcessService) { }

  // Angular hooks

  ngOnInit() {
    this.queryTracks =
      this._microTracksService.getSelectedClusterTracks(this.clusterID);
    this.pipeline = {
        'Track Search':
          this._processService.getTrackSearchProcess(this.clusterID),
        'Track Alignment':
          this._processService.getTrackAlignmentProcess(this.clusterID),
        'Track Genes': this._processService.getTrackGeneProcess(this.clusterID),
      };
  }

  ngAfterViewInit() {
    const queryGenes = this._geneService.getQueryGenes();
    const allTracks = this._microTracksService.getAllTracks();
    const genes = allTracks.pipe(
        map((tracks) => {
          const filter = (t) => t.cluster == this.clusterID;
          return tracks.filter(filter);
        }),
        switchMap((tracks) => {
          return this._geneService.getGenesForTracks(tracks);
        }),
      );
    // fetch own data because injected components don't have change detection
    combineLatest(queryGenes, this.queryTracks, allTracks, genes)
      .pipe(takeUntil(this._destroy))
      .subscribe(([queryGenes, queryTracks, allTracks, genes]) => {
        this._preDraw(queryGenes, queryTracks, allTracks, genes);
        this.draw();
      });
  }

  ngOnDestroy() {
    this._destroy.next(true);
    this._destroy.complete();
    this._destroyViewer();
  }

  // public

  emitPlotClick(event, track, queryTracks) {
    this.plotClick.emit({event, track, queryTracks});
  }

  emitGeneClick(gene, family, source) {
    this.geneClick.emit({gene, family, source});
  }

  emitGeneOver(event, gene, family, source) {
    this.geneOver.emit({event, gene, family, source});
  }

  emitNameClick(track) {
    this.nameClick.emit({track});
  }

  emitCircos(tracks) {
    this.circos.emit({tracks});
  }

  emitReference(track) {
    this.reference.emit({track});
  }

  saveImage(): void {
    if (this._viewer !== undefined) {
      saveFile('micro-synteny', this._viewer.xml(), 'image/svg+xml', 'svg');
    }
  }

  showCircos(): boolean {
    return this.circos.observers.length > 0;
  }

  showReference(): boolean {
    return this.reference.observers.length > 0;
  }

  showMacro(): boolean {
    return this.showCircos() || this.showReference();
  }

  // private

  private _destroyViewer(): void {
    if (this._viewer !== undefined) {
      this._viewer.destroy();
      this._viewer = undefined;
    }
  }

  private _preDraw(queryGenes, queryTracks, tracks, genes): void {
    const {data, bold, familySizes} =
      microShim(this.clusterID, queryTracks, tracks, genes);
    let options = {
        bold: bold,
        highlight: queryGenes.map((g) => g.name),
        selectiveColoring: familySizes,
        plotClick: (e, t, i) => this.emitPlotClick(e, tracks[i], queryTracks),
        geneClick: (t, g, i) => this.emitGeneClick(g.name, g.family, t.source),
        geneOver: (e, t, g, i) => this.emitGeneOver(e, g.name, g.family, t.source),
        nameClick: (t, i) => this.emitNameClick(tracks[i])
      };
    options = Object.assign(options, this.options, {autoResize: false});
    this.draw = this._draw.bind(this, data, options);
  }

  private _draw(data, options) {
    this._destroyViewer();
    const dim = Math.min(
        this.container.nativeElement.clientWidth,
        this.container.nativeElement.clientHeight
      );
    if (dim > 0) {
      this._viewer = new GCV.visualization.Micro(
          this.container.nativeElement,
          GCV.common.colors,
          data,
          options);
    }
  }
}
