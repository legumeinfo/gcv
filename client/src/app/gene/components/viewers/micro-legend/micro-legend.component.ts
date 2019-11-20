// Angular + dependencies
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy,
  Output, ViewChild } from '@angular/core';
import { Observable, Subject, combineLatest } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
// app
import { GCV } from '@gcv-assets/js/gcv';
import { saveFile } from '@gcv/core/utils';
import { Gene, Track } from '@gcv/gene/models';
import { AlignmentMixin, ClusterMixin } from '@gcv/gene/models/mixins';
import { GeneService, MicroTracksService } from '@gcv/gene/services';
import { microLegendShim } from './micro-legend.shim';


@Component({
  selector: 'micro-legend',
  styleUrls: ['../golden-viewer.scss'],
  template: `
    <context-menu (saveImage)="saveImage()"></context-menu>
    <div class="viewer" #container></div>
  `,
})
export class MicroLegendComponent implements AfterViewInit, OnDestroy {

  @Input() options: any = {};
  @Output() click = new EventEmitter();

  @ViewChild('container', {static: true}) container: ElementRef;

  private _destroy: Subject<boolean> = new Subject();
  private _viewer;

  constructor(private _geneService: GeneService,
              private _microTracksService: MicroTracksService) { }

  // Angular hooks

  ngAfterViewInit() {
    // fetch own data because injected components don't have change detection
    const queryGenes = this._geneService.getQueryGenes();
    const tracks = this._microTracksService.getAllTracks();
    combineLatest(tracks, queryGenes)
      .pipe(takeUntil(this._destroy))
      .subscribe(([tracks, queryGenes]) => this._draw(tracks, queryGenes));
  }

  ngOnDestroy() {
    this._destroy.next(true);
    this._destroy.complete();
    this._destroyViewer();
  }

  // public

  emitClick(key) {
    this.click.emit(key);
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

  private _draw(tracks, queryGenes): void {
    this._destroyViewer();
    const {data, singletons} = microLegendShim(tracks);
    let options = {
        blank: singletons,
        blankDashed: {name: "Orphans", id: ''},
        highlight: queryGenes.map((g) => g.family),
        keyClick: (k) => this.emitClick(k.id),
      };
    options = Object.assign(options, this.options);
    this._viewer = new GCV.visualization.Legend(
        this.container.nativeElement,
        GCV.common.colors,
        data,
        options);
  }
}
