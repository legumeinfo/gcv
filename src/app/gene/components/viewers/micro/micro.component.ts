// Angular + dependencies
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { Observable, Subject, combineLatest, firstValueFrom } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';
// app
import { GCV } from '@gcv-assets/js/gcv';
import type { MicroLayout } from '@gcv-assets/js/gcv/visualization/micro';
import { saveFile } from '@gcv/core/utils';
import { Track, Pipeline } from '@gcv/gene/models';
import { AlignmentMixin, ClusterMixin } from '@gcv/gene/models/mixins';
import { PinParams } from '@gcv/gene/models/params';
import { Unplaced } from '@gcv/gene/annotations/resolve';
import {
  AnnotationService,
  FamilyService,
  GeneService,
  MicroTracksService,
  ParamsService,
  ProcessService,
} from '@gcv/gene/services';
// component
import { microShim } from './micro.shim';

@Component({
  selector: 'gcv-micro',
  styleUrls: ['../golden-viewer.scss'],
  template: `
    <gcv-context-menu (saveImage)="saveImage()">
      <ul class="navbar-nav me-auto">
        @if (showMacro()) {
          <li class="nav-item dropdown">
            <a
              class="btn btn-outline-dark dropdown-toggle"
              href="#"
              id="navbarDropdown"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              Macro Viewers
            </a>
            @if (queryTracks | async; as tracks) {
              <div class="dropdown-menu" aria-labelledby="dropdownMenuLink">
                @if (showCircos()) {
                  <div>
                    <h6 class="dropdown-header">Multi</h6>
                    <a
                      [routerLink]="[]"
                      queryParamsHandling="preserve"
                      class="dropdown-item"
                      (click)="emitCircos(tracks)"
                      >Circos</a
                    >
                  </div>
                }
                @if (showCircos() && showReference()) {
                  <div class="dropdown-divider"></div>
                }
                @if (showReference()) {
                  <div>
                    <h6 class="dropdown-header">Reference</h6>
                    @for (track of tracks; track track) {
                      <a
                        [routerLink]="[]"
                        queryParamsHandling="preserve"
                        class="dropdown-item"
                        (click)="emitReference(track)"
                        >{{ track.name }}</a
                      >
                    }
                  </div>
                }
              </div>
            }
          </li>
        }
        <li class="nav-item">
          <button
            type="button"
            class="btn btn-outline-dark ms-1"
            (click)="emitFigure()"
          >
            Make figure
          </button>
        </li>
        @if (notShown | async; as unplaced) {
          @if (unplaced.length > 0) {
            <li class="nav-item dropdown" data-annotations-not-shown>
              <a
                class="btn btn-outline-danger dropdown-toggle ms-1"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                {{ unplaced.length }} not shown
              </a>
              <ul class="dropdown-menu" style="max-width: 30rem">
                @for (u of unplaced; track u.id) {
                  <li
                    class="dropdown-item-text small"
                    style="white-space: normal"
                  >
                    <b
                      >{{ u.annotation.kind
                      }}{{
                        u.annotation.text ? ' ' + u.annotation.text : ''
                      }}</b
                    >:
                    {{ u.reason }}
                  </li>
                }
              </ul>
            </li>
          }
        }
        @if (annotated | async) {
          <li class="nav-item">
            <button
              type="button"
              class="btn btn-outline-dark ms-1"
              title="Remove every pin and annotation from the view"
              (click)="clearAnnotations()"
            >
              Clear annotations
            </button>
          </li>
        }
      </ul>
      <gcv-pipeline
        [info]="info"
        [pipeline]="pipeline"
        navcenter
      ></gcv-pipeline>
    </gcv-context-menu>
    <div (gcvOnResize)="draw()" class="viewer" #container></div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class MicroComponent implements AfterViewInit, OnDestroy, OnInit {
  private _annotationService = inject(AnnotationService);
  private _familyService = inject(FamilyService);
  private _geneService = inject(GeneService);
  private _microTracksService = inject(MicroTracksService);
  private _paramsService = inject(ParamsService);
  private _processService = inject(ProcessService);

  @Input() clusterID: number;
  @Input() options: any = {};
  // viewer
  @Output() plotClick = new EventEmitter();
  @Output() geneClick = new EventEmitter();
  @Output() geneOver = new EventEmitter();
  @Output() nameClick = new EventEmitter();
  // context menu
  @Output() circos = new EventEmitter();
  @Output() reference = new EventEmitter();
  @Output() figure = new EventEmitter<{ gene: string }>();

  @ViewChild('container', { static: true }) container: ElementRef;

  draw = () => {
    /* no-op */
  };

  private _destroy: Subject<boolean> = new Subject();
  private _viewer;
  private _pins: PinParams;
  // the annotations placed on this cluster, in the viewer's track indices
  private _annotations = [];

  info = `<p>This is the micro synteny <i>pipeline</i>.
          It depicts the flow of data from one <i>process</i> to the next for
          <u>this</u> micro synteny viewer.</p>
          <p class="mb-0">
          <b>Track Search</b> searches for micro tracks similar to the query
          tracks in this viewer.
          <br>
          <b>Track Alignment</b> aligns the search result tracks to the query
          tracks.
          <br>
          <b>Track Genes</b> fetches the genes for all the tracks in the viewer.
          </p>`;
  pipeline: Pipeline;

  queryTracks: Observable<(Track & ClusterMixin & AlignmentMixin)[]>;
  // whether the view has pins or annotations, even unreadable ones
  annotated: Observable<boolean>;
  notShown: Observable<Unplaced[]>;

  // Angular hooks

  ngOnInit() {
    this.notShown = this._annotationService
      .getResolution()
      .pipe(map(({ unplaced }) => unplaced));
    this.annotated = combineLatest([
      this._paramsService.getPinParams(),
      this._paramsService.getAnnotationListParams(),
    ]).pipe(
      map(
        ([{ pingene, pinfam }, { annot }]) =>
          pingene.length +
            pinfam.length +
            annot.items.length +
            annot.rejected.length >
          0,
      ),
    );
    this.queryTracks = this._microTracksService.getSelectedClusterTracks(
      this.clusterID,
    );
    this.pipeline = {
      'Track Search': this._processService.getTrackSearchProcess(
        this.clusterID,
      ),
      'Track Alignment': this._processService.getTrackAlignmentProcess(
        this.clusterID,
      ),
      'Track Genes': this._processService.getTrackGeneProcess(this.clusterID),
    };
  }

  ngAfterViewInit() {
    const queryGenes = this._geneService.getQueryGenes();
    const allTracks = this._microTracksService.getAllTracks();
    const genes = allTracks.pipe(
      map((tracks) => {
        const filter = (t) => t.cluster == this.clusterID;
        return tracks.filter(filter);
      }),
      switchMap((tracks) => {
        return this._geneService.getGenesForTracks(tracks);
      }),
    );
    const omittedFamilies = this._familyService.selectOmittedFamilies();
    // fetch own data because injected components don't have change detection
    combineLatest(
      queryGenes,
      this.queryTracks,
      allTracks,
      genes,
      omittedFamilies,
    )
      .pipe(takeUntil(this._destroy))
      .subscribe(
        ([queryGenes, queryTracks, allTracks, genes, omittedFamilies]) => {
          this._preDraw(
            queryGenes,
            queryTracks,
            allTracks,
            genes,
            omittedFamilies,
          );
          this.draw();
        },
      );
    // annotations change the layout, so the viewer redraws
    this._annotationService
      .getResolution()
      .pipe(takeUntil(this._destroy))
      .subscribe(({ placed }) => {
        this._annotations = placed.filter((p) => p.cluster === this.clusterID);
        this.draw();
      });
    // pins change only marks, so the viewer applies them without redrawing
    this._paramsService
      .getPinParams()
      .pipe(takeUntil(this._destroy))
      .subscribe((pins) => {
        this._pins = pins;
        this._viewer?.setPins(...this._pinArgs());
      });
  }

  ngOnDestroy() {
    this._destroy.next(true);
    this._destroy.complete();
    this._destroyViewer();
  }

  // public

  emitPlotClick(event, track, queryTracks) {
    this.plotClick.emit({ event, track, queryTracks });
  }

  emitGeneClick(gene, family, source) {
    this.geneClick.emit({ gene, family, source });
  }

  emitGeneOver(event, gene, family, source) {
    this.geneOver.emit({ event, gene, family, source });
  }

  emitNameClick(track) {
    this.nameClick.emit({ track });
  }

  emitCircos(tracks) {
    this.circos.emit({ tracks });
  }

  emitReference(track) {
    this.reference.emit({ track });
  }

  // names the figure's cluster by its query gene, or a gene of its first
  // query track
  async emitFigure() {
    const [tracks, queryGenes] = await firstValueFrom(
      combineLatest([this.queryTracks, this._geneService.getQueryGenes()]),
    );
    const names = new Set(tracks.flatMap((t) => t.genes));
    const gene =
      queryGenes.map((g) => g.name).find((g) => names.has(g)) ??
      tracks[0]?.genes[Math.floor(tracks[0].genes.length / 2)];
    if (gene !== undefined) {
      this.figure.emit({ gene });
    }
  }

  // returns whether there was a drawn viewer to save
  saveImage(): boolean {
    if (this._viewer === undefined) {
      return false;
    }
    saveFile('micro-synteny', this._viewer.xml(), 'image/svg+xml', 'svg');
    return true;
  }

  // where the drawn viewer put its columns, tracks and annotations, and the
  // area its scrolling container shows; undefined while it isn't drawn, as
  // behind another tab
  layout():
    | {
        layout: MicroLayout;
        visible: { x: number; y: number; width: number; height: number };
      }
    | undefined {
    if (this._viewer === undefined) return undefined;
    const r = (
      this.container.nativeElement as HTMLElement
    ).getBoundingClientRect();
    return {
      layout: this._viewer.layout(),
      visible: { x: r.left, y: r.top, width: r.width, height: r.height },
    };
  }

  clearAnnotations(): void {
    this._paramsService.clearAnnotations();
  }

  showCircos(): boolean {
    return this.circos.observers.length > 0;
  }

  showReference(): boolean {
    return this.reference.observers.length > 0;
  }

  showMacro(): boolean {
    return this.showCircos() || this.showReference();
  }

  // private

  private _destroyViewer(): void {
    if (this._viewer !== undefined) {
      this._viewer.destroy();
      this._viewer = undefined;
    }
  }

  private _preDraw(
    queryGenes,
    queryTracks,
    tracks,
    genes,
    omittedFamilies,
  ): void {
    const {
      data,
      bold,
      familySizes,
      tracks: clusterTracks,
    } = microShim(this.clusterID, queryTracks, tracks, genes, omittedFamilies);
    let options = {
      bold: bold,
      highlight: queryGenes.map((g) => g.name),
      selectiveColoring: familySizes,
      plotClick: (e, t, i) =>
        this.emitPlotClick(e, clusterTracks[i], queryTracks),
      geneClick: (t, g) => this.emitGeneClick(g.name, g.family, t.source),
      geneOver: (e, t, g) => this.emitGeneOver(e, g.name, g.family, t.source),
      nameClick: (t, i) => this.emitNameClick(clusterTracks[i]),
    };
    options = Object.assign(options, this.options, { autoResize: false });
    this.draw = this._draw.bind(this, data, options);
  }

  private _pinArgs(): [{ genes: string[]; families: string[] }, string] {
    const { pingene = [], pinfam = [], pinlabels } = this._pins ?? {};
    return [{ genes: pingene, families: pinfam }, pinlabels];
  }

  private _draw(data, options) {
    // a redraw keeps the pins current when it happens
    const [pins, pinLabels] = this._pinArgs();
    options = { ...options, pins, pinLabels, annotations: this._annotations };
    let tempViewer: any;
    const dim = Math.min(
      this.container.nativeElement.clientWidth,
      this.container.nativeElement.clientHeight,
    );
    // draw the new viewer before destroying the old to preserve scroll position
    if (dim > 0) {
      tempViewer = new GCV.visualization.Micro(
        this.container.nativeElement,
        GCV.common.colors,
        data,
        options,
      );
    }
    this._destroyViewer();
    this._viewer = tempViewer;
  }
}
