// Angular + dependencies
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy,
  Output, ViewChild } from '@angular/core';
import { Observable, Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
// app
import { GCV } from '@gcv-assets/js/gcv';
import { Gene, Plot, Track } from '@gcv/gene/models';

@Component({
  selector: 'plot',
  styles: [],
  template: '<div #container></div>',
})
export class PlotComponent implements AfterViewInit, OnDestroy {

  @Input() plots: Observable<Plot[]>;
  @Input() genes: Observable<Gene[]>;
  @Input() colors: any;  // D3 color function
  @Input() options: any = {};
  @Output() plotClick = new EventEmitter();
  @Output() geneClick = new EventEmitter();


  @ViewChild('container', {static: true}) container: ElementRef;

  private _destroy: Subject<boolean> = new Subject();
  private _viewers;

  // Angular hooks

  ngAfterViewInit() {
    combineLatest(this.plots, this.genes)
      .pipe(takeUntil(this._destroy))
      .subscribe(([plots, genes]) => this._draw(plots, genes));
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

  private _shim(plots: Plot[], genes: Gene[]) {
    const geneMap = {};
    genes.forEach((g) => geneMap[g.name] = g);
    return plots.map((p) => {
      const reference = p.reference as Track;
      // make plot
      const plot = {
          chromosome_name: reference.name,
          genes: []
        };
      // make plot genes
      const xCoordinates = p.pairs.every(({i, j}) => {
          return p.sequence.genes[j] in geneMap;
        });
      const yCoordinates = p.pairs.every(({i, j}) => {
          return reference.genes[i] in geneMap;
        });
      const geneToPoint = (g) => (g.fmin+g.fmax)/2;
      p.pairs.forEach(({i, j}) => {
        const gene = {
            name: reference.genes[i],
            family: reference.families[i],
            x: (xCoordinates) ? geneToPoint(geneMap[p.sequence.genes[j]]) : j,
            y: (yCoordinates) ? geneToPoint(geneMap[reference.genes[i]]) : i, 
          };
        plot.genes.push(gene);
      });
      return plot;
    });
  }

  private _destroyViewers(): void {
    if (this._viewers !== undefined) {
      this._viewers.forEach((viewer) => viewer.destroy());
    }
  }

  private _draw(plots: Plot[], genes: Gene[]): void {
    const data = this._shim(plots, genes);
    this._destroyViewers();
    this._viewers = data.map((plot, i) => {
      let options = {
          plotClick: () => this.emitPlot(plot),
          geneClick: (g, j) => {
            const source = (plots[i].reference as Track).source;
            this.emitGene(g.name, g.family, source);
          },
        };
      options = Object.assign(options, this.options);
        return new GCV.visualization.Plot(
          this.container.nativeElement,
          this.colors,
          plot,
          options)
      });
  }
}
