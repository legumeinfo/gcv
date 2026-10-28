// Angular
import {
  AfterViewInit,
  Component,
  OnDestroy,
  ViewChild,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { Observable, Subject, combineLatest } from 'rxjs';
import { map, takeUntil, tap } from 'rxjs/operators';
// app
import {
  GoldenLayoutDirective,
  TooltipFactoryDirective,
} from '@gcv/gene/directives';
import { figureCluster } from '@gcv/gene/figure';
import { MicroTracksService, ParamsService } from '@gcv/gene/services';
import { GeneViewHighlight } from '@gcv/gene/webmcp/display.tools';
import { attachGeneViewToWebMcp } from '@gcv/webmcp/gene-view.host';
import * as fromDetails from './details';
import { PanelService } from './panel.service';
import * as fromTooltips from './tooltips';
import * as fromViewers from './viewers';
// dependencies

@Component({
  selector: 'gcv-gene',
  styleUrls: ['./gene.component.scss'],
  templateUrl: './gene.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
  providers: [PanelService, GeneViewHighlight],
})
export class GeneComponent implements AfterViewInit, OnDestroy {
  private _microTracksService = inject(MicroTracksService);
  private _panelService = inject(PanelService);
  private _paramsService = inject(ParamsService);

  @ViewChild(GoldenLayoutDirective, { static: true }) goldenLayoutDirective;
  @ViewChild(TooltipFactoryDirective, { static: true }) tooltipFactoryDirective;

  private _destroy: Subject<boolean> = new Subject();

  layoutComponents = [
    ...fromDetails.layoutComponents,
    ...fromViewers.layoutComponents,
  ];
  layoutConfig = {
    settings: {
      showPopoutIcon: false,
    },
    root: {
      type: 'row',
      content: [
        { type: 'column', content: [] },
        { type: 'column', content: [] },
      ],
    },
  };
  tooltipComponents = [...fromTooltips.tooltipComponents];
  showLeftSlider: Observable<boolean>;

  constructor() {
    attachGeneViewToWebMcp();
  }

  // Angular hooks

  ngAfterViewInit(): void {
    const tipOptions = {
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
    };
    this._panelService.attach(
      this.goldenLayoutDirective,
      this.tooltipFactoryDirective,
      tipOptions,
    );
    // a reset replaces every panel, so the figure tab follows it, and the
    // URL's fig: the tab is open exactly while fig is
    combineLatest([
      this._microTracksService
        .selectClusterIDs()
        .pipe(tap((IDs) => this._panelService.reset(IDs))),
      this._paramsService.getFigureParams().pipe(map(({ fig }) => fig)),
      this._microTracksService.getQueryAlignment(),
    ])
      .pipe(takeUntil(this._destroy))
      .subscribe(([IDs, fig, query]) => {
        if (fig === null) {
          this._panelService.closeFigure();
        } else if (IDs.length > 0 && query.tracks.length > 0) {
          this._panelService.openFigure(figureCluster(fig.cl, query.tracks));
        }
      });
  }

  ngOnDestroy(): void {
    this._destroy.next(true);
    this._destroy.complete();
  }
}
