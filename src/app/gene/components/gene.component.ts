// Angular
import {
  AfterViewInit,
  Component,
  OnDestroy,
  ViewChild,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
// app
import {
  GoldenLayoutDirective,
  TooltipFactoryDirective,
} from '@gcv/gene/directives';
import { MicroTracksService } from '@gcv/gene/services';
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
    this._microTracksService
      .selectClusterIDs()
      .pipe(takeUntil(this._destroy))
      .subscribe((IDs) => this._panelService.reset(IDs));
  }

  ngOnDestroy(): void {
    this._destroy.next(true);
    this._destroy.complete();
  }
}
