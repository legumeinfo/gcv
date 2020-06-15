// Angular
import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
// app
import { GoldenLayoutDirective, TooltipFactoryDirective }
  from '@gcv/gene/directives';
import { MicroTracksService } from '@gcv/gene/services';
import * as fromDetails from './details';
import * as fromTooltips from './tooltips';
import * as fromViewers from './viewers';
// dependencies
import tippy from 'tippy.js';


@Component({
  selector: 'gcv-gene',
  styleUrls: ['./gene.component.scss'],
  templateUrl: './gene.component.html',
})
export class GeneComponent implements AfterViewInit, OnDestroy {

  @ViewChild(GoldenLayoutDirective, {static: true}) goldenLayoutDirective;
  @ViewChild(TooltipFactoryDirective, {static: true}) tooltipFactoryDirective;

  private _destroy: Subject<boolean> = new Subject();
  private _tipOptions: any;

  layoutComponents = [
      ...fromDetails.layoutComponents,
      ...fromViewers.layoutComponents,
    ];
  layoutConfig = {
      settings: {
        showPopoutIcon: false,
      },
      content: [{
        type: 'row',
        content: [{type: 'column', content: []}, {type: 'column', content: []}],
      }]
    };
  tooltipComponents = [...fromTooltips.tooltipComponents];
  showLeftSlider: Observable<boolean>;

  constructor(private _microTracksService: MicroTracksService) { }

  // Angular hooks

  ngAfterViewInit(): void {
    this._tipOptions = {
      popperOptions: {
        modifiers: [
          {
            name: 'preventOverflow',
            options: {
              rootBoundary: this.goldenLayoutDirective._el.nativeElement,
            },
          },
        ],
      },
    }
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
    this._addItem([0, 1], fromViewers.macroLegendConfigFactory);
    const click = (id, family) => {
        this._stackItem(id, fromDetails.familyDetailConfigFactory, family);
      };
    this._addItem([0, 1], fromViewers.microLegendConfigFactory, {click});
  }

  private _addPlots(id, track, queryTracks, type): void {
    const plotStackConfig =
      this._stackItem(id, fromViewers.plotStackConfigFactory, track);
    const stackID = plotStackConfig.id;
    const geneClick = (id, gene, family, source) => {
        const args = [gene, family, source];
        this._stackItem(id, fromDetails.geneDetailConfigFactory, ...args);
      };
    const geneOver = (e, gene, family, source) => {
        const inputs = {gene, source};
        const config =
          fromTooltips.geneTooltipConfigFactory(inputs, this._tipOptions);
        this.tooltipFactoryDirective.componentTip(e.target, config);
      };
    queryTracks.forEach((query) => {
      const args = [type, track, query, {geneClick, geneOver}];
      this._stackItem(stackID, fromViewers.plotConfigFactory, ...args);
    });
  }

  private _addMicroViewers(clusterIDs): void {
    const options = {
        plotClick: (e, id, track, queryTracks) => {
          const addPlots = this._addPlots.bind(this, id, track, queryTracks);
          const outputs = {
              localClick: () => addPlots('local'),
              globalClick: () => addPlots('global'),
            };
          const config =
            fromTooltips.plotTooltipConfigFactory(outputs, this._tipOptions);
          this.tooltipFactoryDirective.componentTip(e.target, config);
        },
        geneClick: (id, gene, family, source) => {
          this._stackItem(id, fromDetails.geneDetailConfigFactory, gene, family,
            source);
        },
        geneOver: (e, gene, family, source) => {
          const inputs = {gene, source};
          const config =
            fromTooltips.geneTooltipConfigFactory(inputs, this._tipOptions);
          this.tooltipFactoryDirective.componentTip(e.target, config);
        },
        nameClick: (id, track) => {
          this._stackItem(id, fromDetails.trackDetailConfigFactory, track);
        },
        circos: (id, clusterID) => {
          const args = [clusterID];
          this._stackItem(id, fromViewers.macroCircosConfigFactory, ...args);
        },
        reference: (id, name, source, clusterID) => {
          const outputs = {
              blockOver: (e, pairwiseBlocks, block) => {
                const inputs = {pairwiseBlocks, block};
                const config = fromTooltips
                  .macroBlockTooltipConfigFactory(inputs, this._tipOptions);
                this.tooltipFactoryDirective.componentTip(e.target, config);
              }
            };
          const args = [name, source, clusterID, outputs];
          this._stackItem(id, fromViewers.macroConfigFactory, ...args);
        }
      };
    clusterIDs.forEach((id) => {
      this._addItem([0, 0], fromViewers.microConfigFactory, id, options);
    });
  }

}
