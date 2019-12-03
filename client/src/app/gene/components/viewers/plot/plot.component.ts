// Angular + dependencies
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy,
  Output, ViewChild } from '@angular/core';
import { Observable, Subject, combineLatest } from 'rxjs';
import { filter, mergeAll, switchMap, takeUntil } from 'rxjs/operators';
// app
import { GCV } from '@gcv-assets/js/gcv';
import { saveFile } from '@gcv/core/utils';
import { Gene, Plot, Track } from '@gcv/gene/models';
import { ClusterMixin } from '@gcv/gene/models/mixins';
import { GeneService, PlotsService } from '@gcv/gene/services';
import { plotShim } from './plot.shim';


@Component({
  selector: 'plot',
  styleUrls: ['../golden-viewer.scss'],
  template: `
    <context-menu (saveImage)="saveImage()"></context-menu>
    <div class="viewer" #container></div>
  `,
})
export class PlotComponent implements AfterViewInit, OnDestroy {

  @Input() type: 'local' | 'global';
  @Input() reference: Track;
  @Input() track: (Track | ClusterMixin);
  @Input() options: any = {};
  @Output() plotClick = new EventEmitter();
  @Output() geneClick = new EventEmitter();


  @ViewChild('container', {static: true}) container: ElementRef;

  private _destroy: Subject<boolean> = new Subject();
  private _viewer;

  constructor(private _plotsService: PlotsService,
              private _geneService: GeneService) { }

  // Angular hooks

  ngAfterViewInit() {
    const plotFilter = (plot) => plot.reference.name === this.reference.name;
    const plots = this.type == 'local' ?
      this._plotsService.getLocalPlots(this.track) :
      this._plotsService.getGlobalPlots(this.track);
    // NOTE: this feels awkward; is there a better way to get one plot?
    const plot = plots.pipe(
        mergeAll(),
        filter(plotFilter),
      );
    const genes = plot.pipe(
        switchMap((p) => {
          const tracks = [p.reference, p.sequence];
          return this._geneService.getGenesForTracks(tracks);
        }),
      );
    combineLatest(plot, genes)
      .pipe(takeUntil(this._destroy))
      .subscribe(([plot, genes]) => this._draw(plot, genes));
  }

  ngOnDestroy() {
    this._destroy.next(true);
    this._destroy.complete();
    this._destroyViewers();
  }

  // public

  emitPlot(plot) {
    this.plotClick.emit({plot});
  }

  emitGene(gene, family, source) {
    this.geneClick.emit({gene, family, source});
  }

  saveImage(): void {
    if (this._viewer !== undefined) {
      saveFile('micro-synteny', this._viewer.xml(), 'image/svg+xml', 'svg');
    }
  }

  // private

  private _destroyViewers(): void {
    if (this._viewer !== undefined) {
      this._viewer.destroy();
    }
  }

  private _draw(plot: Plot, genes: Gene[]): void {
    this._destroyViewers();
    const data = plotShim(plot, genes);
    let options = {
        plotClick: () => this.emitPlot(plot),
        geneClick: (g, j) => {
          const source = plot.sequence.source;
          this.emitGene(g.name, g.family, source);
        },
      };
    options = Object.assign(options, this.options);
    this._viewer = new GCV.visualization.Plot(
      this.container.nativeElement,
      GCV.common.colors,
      data,
      options);
  }
}
