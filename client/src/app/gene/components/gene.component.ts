// Angular
import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
// app
import { GoldenLayoutDirective, TooltipFactoryDirective }
  from '@gcv/gene/directives';
import { LayoutService, MicroTracksService } from '@gcv/gene/services';
import * as fromDetails from './details';
import * as fromTooltips from './tooltips';
import * as fromViewers from './viewers';
// dependencies
import tippy from 'tippy.js';


@Component({
  selector: 'gene',
  styleUrls: ['./gene.component.scss'],
  templateUrl: './gene.component.html',
})
export class GeneComponent implements AfterViewInit, OnDestroy {

  @ViewChild(GoldenLayoutDirective, {static: true}) goldenLayoutDirective;
  @ViewChild(TooltipFactoryDirective, {static: true}) tooltipFactoryDirective;

  private _destroy: Subject<boolean> = new Subject();

  layoutComponents = [
      ...fromDetails.layoutComponents,
      ...fromViewers.layoutComponents,
    ];
  layoutConfig = {
      content: [{
        type: 'row',
        content: [{type: 'column', content: []}, {type: 'column', content: []}],
      }]
    };
  tooltipComponents = [...fromTooltips.tooltipComponents];
  showLeftSlider: Observable<boolean>;

  constructor(private _layoutService: LayoutService,
              private _microTracksService: MicroTracksService) { }

  // Angular hooks

  ngOnInit(): void {
    this.showLeftSlider = this._layoutService.getLeftSliderState();
  }

  ngAfterViewInit(): void {
    this._microTracksService.getClusterIDs()
      .pipe(takeUntil(this._destroy))
      .subscribe((IDs) => this._resetLayout(IDs));
  }

  ngOnDestroy(): void {
    this._destroy.next(true);
    this._destroy.complete();
  }

  // private

  private _resetLayout(IDs): void {
    this.goldenLayoutDirective.reset();
    this._initializeLegends();
    this._addMicroViewers(IDs);
  }

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
        this._stackItem(id, fromDetails.familyDetailConfigFactory, family);
      };
    this._addItem([0, 1], fromViewers.microLegendConfigFactory, {click});
  }

  private _addPlots(id, type, track, queryTracks): void {
    const plotStackConfig =
      this._stackItem(id, fromViewers.plotStackConfigFactory, track);
    const stackID = plotStackConfig.id;
    const geneClick = (id, gene, family, source) => {
        const args = [gene, family, source];
        this._stackItem(id, fromDetails.geneDetailConfigFactory, ...args);
      };
    queryTracks.forEach((query) => {
      const args = [type, track, query, {geneClick}];
      this._stackItem(stackID, fromViewers.plotConfigFactory, ...args);
    });
  }

  private _addMicroViewers(clusterIDs): void {
    const plotClick = (e, id, track, queryTracks) => {
        const outputs = {
            localClick: () => this._addPlots(id, 'local', track, queryTracks),
            globalClick: () => this._addPlots(id, 'global', track, queryTracks),
          };
        const tipOptions = {
            boundary: this.goldenLayoutDirective._el.nativeElement,
          };
        const config =
          fromTooltips.geneTooltipConfigFactory(outputs, tipOptions);
        this.tooltipFactoryDirective.componentTip(e.target, config);
      };
    const geneClick = (id, gene, family, source) => {
        this._stackItem(id, fromDetails.geneDetailConfigFactory, gene, family, source);
      };
    const nameClick = (id, track) => {
        this._stackItem(id, fromDetails.trackDetailConfigFactory, track);
      };
    clusterIDs.forEach((id) => {
      const options = {plotClick, geneClick, nameClick};
      this._addItem([0, 0], fromViewers.microConfigFactory, id, options);
    });
  }

  // public

  closeLeftSlider(): void {
    this._layoutService.closeLeftSlider();
  }

  openLeftSlider(): void {
    this._layoutService.openLeftSlider();
  }
}
