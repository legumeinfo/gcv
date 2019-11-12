// Angular
import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
// app
import { GoldenLayoutDirective } from '@gcv/gene/directives';
import { LayoutService, MicroTracksService } from '@gcv/gene/services';
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
        content: [{type: 'column', content: []}, {type: 'column', content: []}],
      }]
    };
  showLeftSlider: Observable<boolean>;

  constructor(private _layoutService: LayoutService,
              private _microTracksService: MicroTracksService) { }

  // Angular hooks

  ngOnInit(): void {
    this.showLeftSlider = this._layoutService.getLeftSliderState();
  }

  ngAfterViewInit(): void {
    this._initializeLegends();
    this._initializeMicroTracks();
  }

  ngOnDestroy(): void {
    this._destroy.next(true);
    this._destroy.complete();
  }

  // private

  private _addItem(index, configFactory, ...args): any {
    const config = configFactory(...args);
    this.goldenLayoutDirective.addItem(config, index);
    return config;
  }

  private _stackItem(id, configFactory, ...args): any {
    const config = configFactory(...args);
    this.goldenLayoutDirective.stackItem(config, id);
    return config;
  }

  private _initializeLegends(): void {
    const click = (id, family) => {
        this._stackItem(id, familyDetailConfigFactory, family);
      };
    this._addItem([0, 1], microLegendConfigFactory, {click});
  }

  private _initializeMicroTracks(): void {
    this._microTracksService.clusterIDs
      .pipe(takeUntil(this._destroy))
      .subscribe((IDs) => this._addMicroViewers(IDs));
  }

  private _addLocalPlots(id, track, queryTracks): void {
    const plotStackConfig = this._stackItem(id, plotStackConfigFactory, track);
    const stackID = plotStackConfig.id;
    const geneClick = (id, gene, family, source) => {
        this._stackItem(id, geneDetailConfigFactory, gene, family, source);
      };
    queryTracks.forEach((query) => {
      this._stackItem(stackID, plotConfigFactory, track, query, {geneClick});
    });
  }

  private _addMicroViewers(clusterIDs): void {
    const plotClick = (id, track, queryTracks) => {
        this._addLocalPlots(id, track, queryTracks);
      };
    const geneClick = (id, gene, family, source) => {
        this._stackItem(id, geneDetailConfigFactory, gene, family, source);
      };
    const nameClick = (id, track) => {
        this._stackItem(id, trackDetailConfigFactory, track);
      };
    clusterIDs.forEach((id) => {
      const options = {plotClick, geneClick, nameClick};
      this._addItem([0, 0], microConfigFactory, id, options);
    });
  }

  // public

  closeLeftSlider(): void {
    this._layoutService.closeLeftSlider();
  }
}
