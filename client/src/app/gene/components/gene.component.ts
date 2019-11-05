// Angular
import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
// app
import { GCV } from '@gcv-assets/js/gcv';
import { GoldenLayoutDirective } from '@gcv/gene/directives';
import { GeneService, MicroTracksService, PlotsService }
  from '@gcv/gene/services';
import { FamilyDetailComponent, familyDetailConfigFactory }
  from './family-detail.component';
import { GeneDetailComponent, geneDetailConfigFactory }
  from './gene-detail.component';
import { LegendComponent, legendConfigFactory } from './legend.component';
import { MacroComponent } from './macro.component';
import { MicroComponent, microConfigFactory } from './micro.component';
import { PlotComponent, plotConfigFactory, plotStackConfigFactory }
  from './plot.component';
import { TrackDetailComponent, trackDetailConfigFactory }
  from './track-detail.component';


@Component({
  selector: 'gene',
  styleUrls: ['./gene.component.scss'],
  templateUrl: './gene.component.html',
})
export class GeneComponent implements AfterViewInit, OnDestroy {

  @ViewChild(GoldenLayoutDirective, {static: true}) goldenLayoutDirective;

  private _destroy: Subject<boolean> = new Subject();
  private _microColors = GCV.common.colors;
  private _microLegend: Observable<{name: string, id: string}[]>;

  layoutComponents = [
      {component: GeneDetailComponent, name: 'gene'},
      {component: FamilyDetailComponent, name: 'family'},
      {component: LegendComponent, name: 'legend'},
      {component: MacroComponent, name: 'macro'},
      {component: MicroComponent, name: 'micro'},
      {component: PlotComponent, name: 'plot'},
      {component: TrackDetailComponent, name: 'track'}
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

  constructor(private _geneService: GeneService,
              private _microTracksService: MicroTracksService,
              private _plotsService: PlotsService) { }

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
    this._microLegend = this._microTracksService.allTracks
      .pipe(
        takeUntil(this._destroy),
        map((tracks) => {
          const reducer = (accumulator, track) => {
              track.families.forEach((f) => accumulator.add(f));
              return accumulator;
            };
          const familySet = tracks.reduce(reducer, new Set());
          const families = Array.from(familySet);
          const legendFamilies = families.map((f: string) => ({name: f, id: f}));
          return legendFamilies;
        })
      );
    const click = (id, family) => {
        const familyConfig =
          familyDetailConfigFactory(family, this._microTracksService);
        this.goldenLayoutDirective.stackItem(familyConfig, id);
      };
    const legend = legendConfigFactory(this._microLegend, {click});
    this.goldenLayoutDirective.addItem(legend, [0, 1]);
  }

  private _initializeMicroTracks(): void {
    this._microTracksService.clusterIDs
      .pipe(takeUntil(this._destroy))
      .subscribe((IDs) => {
        this._addMicroViewers(IDs);
      });
  }

  private _localPlots(id, track, queryTracks) {
    const plotStackConfig = plotStackConfigFactory(track);
    this.goldenLayoutDirective.stackItem(plotStackConfig, id);
    // NOTE: this feel awkward; do we really need to know which tracks are being
    // plotted ahead of time?
    const geneClick = (id, gene, family, source) => {
        const geneConfig = geneDetailConfigFactory(gene, family, source);
        this.goldenLayoutDirective.stackItem(geneConfig, id);
      };
    queryTracks.forEach((query) => {
      const plotConfig = plotConfigFactory(
          track,
          query,
          this._plotsService,
          this._geneService,
          {geneClick});
      this.goldenLayoutDirective.stackItem(plotConfig, plotStackConfig.id);
    });
  }

  private _addMicroViewers(clusterIDs): void {
    const plotClick = (id, track, queryTracks) => {
        this._localPlots(id, track, queryTracks);
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
      const config = microConfigFactory(
          id,
          this._microTracksService,
          this._geneService,
          {plotClick, geneClick, nameClick});
      this.goldenLayoutDirective.addItem(config, [0, 0]);
    });
  }

  // public
}
