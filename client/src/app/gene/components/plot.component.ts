// Angular + dependencies
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy,
  Output, ViewChild } from '@angular/core';
import { Observable, Subject, combineLatest } from 'rxjs';
import { filter, mergeAll, takeUntil } from 'rxjs/operators';
// app
import { GCV } from '@gcv-assets/js/gcv';
import { Gene, Plot, Track, clusteredTrackID } from '@gcv/gene/models';
import { ClusterMixin } from '@gcv/gene/models/mixins';
import { GeneService, PlotsService } from '@gcv/gene/services';

@Component({
  selector: 'plot',
  styles: [],
  template: '<div #container></div>',
})
export class PlotComponent implements AfterViewInit, OnDestroy {

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
    // NOTE: this feels awkward; is there a better way to get one plot?
    const plot = this._plotsService.getLocalPlots(this.track).pipe(
      mergeAll(),
      filter((plot) => (plot.reference as Track).name === this.reference.name),
    );
    const genes = this._geneService.getLocalPlotGenes(this.track);
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

  // private

  private _shim(plot: Plot, genes: Gene[]) {
    const geneMap = {};
    genes.forEach((g) => geneMap[g.name] = g);
    const reference = plot.reference as Track;
    // make plot
    const shimPlot = {
        chromosome_name: reference.name,
        genes: []
      };
    // make plot genes
    const xCoordinates = plot.pairs.every(({i, j}) => {
        return plot.sequence.genes[j] in geneMap;
      });
    const yCoordinates = plot.pairs.every(({i, j}) => {
        return reference.genes[i] in geneMap;
      });
    const geneToPoint = (g) => (g.fmin+g.fmax)/2;
    plot.pairs.forEach(({i, j}) => {
      const gene = {
          name: reference.genes[i],
          family: reference.families[i],
          x: (xCoordinates) ? geneToPoint(geneMap[plot.sequence.genes[j]]) : j,
          y: (yCoordinates) ? geneToPoint(geneMap[reference.genes[i]]) : i, 
        };
      shimPlot.genes.push(gene);
    });
    return shimPlot;
  }

  private _destroyViewers(): void {
    if (this._viewer !== undefined) {
      this._viewer.destroy();
    }
  }

  private _draw(plot: Plot, genes: Gene[]): void {
    const data = this._shim(plot, genes);
    this._destroyViewers();
    let options = {
        plotClick: () => this.emitPlot(plot),
        geneClick: (g, j) => {
          const source = (plot.reference as Track).source;
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


export const plotLayoutComponent = {component: PlotComponent, name: 'plot'};


export function plotStackConfigFactory(track: (Track | ClusterMixin)) {
  const cluster = (track as ClusterMixin).cluster;
  const selected = (track as Track);
  const name = selected.name;
  const id = `plots:${clusteredTrackID(track)}`;
  return {
    type: 'stack',
    id: id,
    title: `${name} (${cluster}) plots`,
    content: [],
  };
}


export function plotConfigFactory(
  track: (Track | ClusterMixin),
  reference: Track,
  outputs: any={})
{
  const cluster = (track as ClusterMixin).cluster;
  const selected = (track as Track);
  const trackName = selected.name;
  const referenceName = reference.name;
  const options = {autoResize: true};
  const id = `plot:${clusteredTrackID(track)}x${clusteredTrackID(reference)}`;
  let _outputs = {geneClick: (id, gene, family, source) => { /* no-op */ }};
  _outputs = Object.assign(_outputs, outputs);
  return {
    type: 'component',
    componentName: 'plot',
    id: id,
    title: `${trackName} x ${referenceName} (${cluster})local plot`,
    componentState: {
      inputs: {reference, track, options},
      outputs: {
        geneClick: ({gene, family, source}) => {
          _outputs.geneClick(id, gene, family, source);
        }
      }
    }
  };
}
