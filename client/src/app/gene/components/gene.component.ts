// Angular
import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
// app
import { GoldenLayoutDirective } from '@gcv/gene/directives';
import { MicroTracksService } from '@gcv/gene/services';
import { familyDetailConfigFactory, familyDetailLayoutComponent }
  from './family-detail.component';
import { geneDetailConfigFactory, geneDetailLayoutComponent }
  from './gene-detail.component';
import { macroLayoutComponent } from './macro.component';
import { microLegendConfigFactory, microLegendLayoutComponent }
  from './micro-legend.component';
import { microConfigFactory, microLayoutComponent } from './micro.component';
import { plotConfigFactory, plotLayoutComponent, plotStackConfigFactory }
  from './plot.component';
import { trackDetailConfigFactory, trackDetailLayoutComponent }
  from './track-detail.component';


@Component({
  selector: 'gene',
  styleUrls: ['./gene.component.scss'],
  templateUrl: './gene.component.html',
})
export class GeneComponent implements AfterViewInit, OnDestroy {

  @ViewChild(GoldenLayoutDirective, {static: true}) goldenLayoutDirective;

  private _destroy: Subject<boolean> = new Subject();

  layoutComponents = [
      familyDetailLayoutComponent,
      geneDetailLayoutComponent,
      macroLayoutComponent,
      microLegendLayoutComponent,
      microLayoutComponent,
      plotLayoutComponent,
      trackDetailLayoutComponent,
    ];
  layoutConfig = {
      content: [{
        type: 'row',
        content: [
          {
            type: 'column',
            content: []
          },
          {
            type: 'column',
            content: []
          }
        ],
      }]
    };

  constructor(private _microTracksService: MicroTracksService) { }

  // Angular hooks

  ngAfterViewInit(): void {
    this._initializeLegends();
    this._initializeMicroTracks();
  }

  ngOnDestroy(): void {
    this._destroy.next(true);
    this._destroy.complete();
  }

  // private

  private _initializeLegends(): void {
    const click = (id, family) => {
        const familyConfig = familyDetailConfigFactory(family);
        this.goldenLayoutDirective.stackItem(familyConfig, id);
      };
    const legend = microLegendConfigFactory({click});
    this.goldenLayoutDirective.addItem(legend, [0, 1]);
  }

  private _initializeMicroTracks(): void {
    this._microTracksService.clusterIDs
      .pipe(takeUntil(this._destroy))
      .subscribe((IDs) => this._addMicroViewers(IDs));
  }

  private _addLocalPlots(id, track, queryTracks): void {
    const plotStackConfig = plotStackConfigFactory(track);
    this.goldenLayoutDirective.stackItem(plotStackConfig, id);
    const geneClick = (id, gene, family, source) => {
        const geneConfig = geneDetailConfigFactory(gene, family, source);
        this.goldenLayoutDirective.stackItem(geneConfig, id);
      };
    queryTracks.forEach((query) => {
      const plotConfig = plotConfigFactory(track, query, {geneClick});
      this.goldenLayoutDirective.stackItem(plotConfig, plotStackConfig.id);
    });
  }

  private _addMicroViewers(clusterIDs): void {
    const plotClick = (id, track, queryTracks) => {
        this._addLocalPlots(id, track, queryTracks);
      };
    const geneClick = (id, gene, family, source) => {
        const geneConfig = geneDetailConfigFactory(gene, family, source);
        this.goldenLayoutDirective.stackItem(geneConfig, id);
      };
    const nameClick = (id, track) => {
        const trackConfig = trackDetailConfigFactory(track);
        this.goldenLayoutDirective.stackItem(trackConfig, id);
      };
    clusterIDs.forEach((id) => {
      const config = microConfigFactory(id, {plotClick, geneClick, nameClick});
      this.goldenLayoutDirective.addItem(config, [0, 0]);
    });
  }

  // public
}
