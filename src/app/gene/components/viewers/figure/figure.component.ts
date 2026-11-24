// Angular + dependencies
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { BehaviorSubject, Subject, combineLatest, of } from 'rxjs';
import { debounceTime, map, switchMap, takeUntil } from 'rxjs/operators';
// store
import { geneID } from '@gcv/gene/store/reducers/gene.reducer';
// app
import { GCV } from '@gcv-assets/js/gcv';
import type { MeasureText } from '@gcv-assets/js/gcv/visualization/figure/micro-figure';
import { saveFile } from '@gcv/core/utils';
import { GCV_VERSION } from '@gcv/core/version';
import {
  AlignedTrack,
  clusterAlignments,
  sameLocusTracks,
} from '@gcv/gene/alignment';
import { microShim } from '@gcv/gene/components/viewers/micro/micro.shim';
import {
  FigureManifest,
  TrackOption,
  figureCaption,
  figureModel,
} from '@gcv/gene/figure';
import {
  FIGURE_LIMITS,
  FigureSpec,
  ParsedFigureSpec,
  serializeFigureSpec,
} from '@gcv/gene/models/params';
import {
  FamilyService,
  GeneService,
  MicroTracksService,
  ParamsService,
} from '@gcv/gene/services';

// text widths from the browser's own font metrics
const measureText: MeasureText = (() => {
  const context = document.createElement('canvas').getContext('2d');
  return (text, size, italic = false) => {
    context.font = `${italic ? 'italic ' : ''}${size}px sans-serif`;
    return context.measureText(text).width;
  };
})();

export const PNG_DPI = 300;
export const PNG_DPI_LIMITS = [72, 1200] as const;

// the figure as last drawn: the spec it was drawn for (as fig), and what it
// claims, or why there is no figure
export type FigureRender = {
  fig: string;
  cluster: number | null;
  manifest?: FigureManifest;
  notes: string[];
  caption?: string;
  // some genes' coordinates are still loading
  loading?: boolean;
  // when the figure's gene is in several clusters, a query gene of each
  choices?: { cluster: number; gene: string }[];
};

// A tab that makes a publication figure of its micro-synteny cluster. The
// figure's choices live in the URL (fig), so the tab only reads and writes
// them; it draws the figure with the engine's static renderer, which shares
// the viewer's layout, and downloads it as SVG or PNG.
@Component({
  selector: 'gcv-figure',
  styleUrls: ['../golden-viewer.scss'],
  styles: [
    `
      .figure {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
      }
      .figure-preview {
        flex: 3 1 0;
        min-height: 8rem;
        padding: 0.5rem;
        background: #f3f3f3;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        /* the figure fits the preview both ways (see its sizing) */
        container-type: size;
      }
      .figure-preview :first-child {
        background: #fff;
        box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
      }
      .figure-form {
        flex: 2 1 0;
        min-height: 10rem;
        overflow-y: auto;
        padding: 0.5rem 0.75rem;
        border-top: 1px solid #dee2e6;
        font-size: 0.875rem;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
        gap: 0.5rem 1.25rem;
        align-items: start;
      }
      .figure-section h6 {
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: #6c757d;
        border-bottom: 1px solid #dee2e6;
        padding-bottom: 0.2rem;
        margin-bottom: 0.4rem;
      }
      .figure-tracks {
        max-height: 9rem;
        overflow-y: auto;
        border: 1px solid #dee2e6;
        border-radius: 0.25rem;
        padding: 0.25rem 0.25rem 0.25rem 0.5rem;
      }
      .figure-notes {
        flex: none;
        margin: 0;
        padding: 0.25rem 0.5rem 0.25rem 1.5rem;
        border-top: 1px solid #dee2e6;
        font-size: 0.8rem;
        max-height: 4.5rem;
        overflow-y: auto;
      }
    `,
  ],
  template: `
    <div class="figure">
      <nav class="navbar navbar-light bg-light border-bottom px-2 py-1">
        <span class="navbar-text">Figure of cluster {{ clusterID }}</span>
        <div>
          <button
            type="button"
            class="btn btn-sm btn-outline-dark me-1"
            [disabled]="svg === undefined || loading"
            [title]="
              loading ? 'Waiting for genes’ coordinates' : 'Download SVG'
            "
            (click)="downloadSvg()"
          >
            SVG
          </button>
          <button
            type="button"
            class="btn btn-sm btn-outline-dark"
            [disabled]="svg === undefined || loading"
            [title]="
              loading ? 'Waiting for genes’ coordinates' : 'Download PNG'
            "
            (click)="downloadPng(dpi)"
          >
            PNG
          </button>
          <label class="ms-1 small" for="figure-dpi">at</label>
          <input
            id="figure-dpi"
            class="form-control form-control-sm d-inline-block mx-1"
            style="width: 4.5rem"
            type="number"
            step="1"
            [min]="dpiLimits[0]"
            [max]="dpiLimits[1]"
            [value]="dpi"
            (change)="setDpi($event)"
          />
          <label class="small" for="figure-dpi">dpi</label>
        </div>
      </nav>
      @if (clusterID === null) {
        <div class="p-3" data-figure-cluster>
          <p>
            The figure's gene is in no one cluster of this view. Choose a
            cluster:
          </p>
          @for (choice of clusterChoices; track choice.cluster) {
            <button
              type="button"
              class="btn btn-sm btn-outline-dark me-1"
              (click)="update({ cl: choice.gene })"
            >
              Cluster {{ choice.cluster }}
            </button>
          }
        </div>
      } @else {
        <div class="figure-preview" #preview></div>
        @if (notes.length > 0) {
          <ul class="figure-notes" data-figure-notes>
            @for (note of notes; track note) {
              <li>{{ note }}</li>
            }
          </ul>
        }
        <form class="figure-form" (submit)="$event.preventDefault()">
          <section class="figure-section">
            <h6>Tracks</h6>
            <label class="form-label mb-1" for="figure-top"
              >Best result tracks</label
            >
            <input
              id="figure-top"
              class="form-control form-control-sm mb-2"
              type="number"
              min="1"
              placeholder="all"
              [disabled]="spec.tracks !== undefined"
              [value]="spec.top ?? ''"
              (change)="setNumber('top', $event)"
            />
            <label class="form-label mb-1" for="figure-genus"
              >Genera, comma-separated</label
            >
            <input
              id="figure-genus"
              class="form-control form-control-sm mb-2"
              placeholder="all"
              [disabled]="spec.tracks !== undefined"
              [value]="(spec.genus ?? []).join(', ')"
              (change)="setList('genus', $event)"
            />
            <fieldset class="mb-2" data-figure-tracks>
              <legend class="form-label mb-1" style="font-size: inherit">
                Result tracks shown: {{ chosenTracks() }} of
                {{ trackOptions.length }}
              </legend>
              @if (spec.tracks !== undefined) {
                <p class="small text-muted mb-1">
                  Ticked tracks replace the best tracks and genera above.
                  <button
                    type="button"
                    class="btn btn-link btn-sm p-0 align-baseline"
                    (click)="update({ tracks: undefined })"
                  >
                    Use them again
                  </button>
                </p>
              }
              <div class="figure-tracks">
                @for (option of trackOptions; track option.gene) {
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      [id]="'figure-track-' + $index"
                      [attr.data-track-gene]="option.gene"
                      [checked]="option.chosen"
                      [disabled]="option.chosen && chosenTracks() === 1"
                      (change)="setTrack(option, $event)"
                    />
                    <label
                      class="form-check-label"
                      [for]="'figure-track-' + $index"
                      >{{ option.label }}
                      <span class="text-muted"
                        >({{ option.score }})</span
                      ></label
                    >
                  </div>
                }
              </div>
            </fieldset>
          </section>
          <section class="figure-section">
            <h6>Order and merging</h6>
            <label class="form-label mb-1" for="figure-order">Order</label>
            <select
              id="figure-order"
              class="form-select form-select-sm mb-2"
              (change)="setOrder($event)"
            >
              <option value="view" [selected]="orderChoice() === 'view'">
                As in the view
              </option>
              <option value="score" [selected]="orderChoice() === 'score'">
                By alignment score
              </option>
              <option value="genus" [selected]="orderChoice() === 'genus'">
                By genus, as listed
              </option>
            </select>
            @if (orderChoice() === 'genus') {
              <label class="form-label mb-1" for="figure-order-genera"
                >Genera in order, comma-separated</label
              >
              <input
                id="figure-order-genera"
                class="form-control form-control-sm mb-2"
                [value]="orderGenera().join(', ')"
                (change)="setOrderGenera($event)"
              />
            }
            <label class="form-label mb-1" for="figure-merge"
              >Merge tracks of one locus</label
            >
            <select
              id="figure-merge"
              class="form-select form-select-sm mb-1"
              (change)="setMerge($event)"
            >
              <option value="none" [selected]="mergeChoice() === 'none'">
                None
              </option>
              <option value="both" [selected]="mergeChoice() === 'both'">
                Where names and coordinates both show it
              </option>
              <option value="pairs" [selected]="mergeChoice() === 'pairs'">
                These pairs
              </option>
            </select>
            @if (mergeChoice() === 'pairs') {
              <label class="form-label mb-1" for="figure-merge-pairs"
                >Pairs, one per line: gene / gene, a gene of each track</label
              >
              <textarea
                id="figure-merge-pairs"
                class="form-control form-control-sm mb-1"
                rows="2"
                [value]="mergeLines()"
                (change)="setMergePairs($event)"
              ></textarea>
              @if (mergeErrors.length > 0) {
                <ul class="text-danger small ps-3 mb-1" data-merge-errors>
                  @for (error of mergeErrors; track error) {
                    <li>{{ error }}</li>
                  }
                </ul>
              }
            }
          </section>
          <section class="figure-section">
            <h6>Columns</h6>
            <label class="form-label mb-1" for="figure-crop-from"
              >From gene</label
            >
            <input
              id="figure-crop-from"
              class="form-control form-control-sm mb-1"
              placeholder="first column"
              [value]="spec.crop?.[0] ?? ''"
              (change)="setCrop(0, $event)"
            />
            <label class="form-label mb-1" for="figure-crop-to">To gene</label>
            <input
              id="figure-crop-to"
              class="form-control form-control-sm mb-2"
              placeholder="last column"
              [value]="spec.crop?.[1] ?? ''"
              (change)="setCrop(1, $event)"
            />
          </section>
          <section class="figure-section">
            <h6>Families</h6>
            <label class="form-label mb-1" for="figure-colour"
              >Families to color, comma-separated</label
            >
            <input
              id="figure-colour"
              class="form-control form-control-sm mb-1"
              placeholder="the query's shared families"
              [value]="(spec.colour ?? []).join(', ')"
              (change)="setList('colour', $event)"
            />
            <div class="form-check">
              <input
                id="figure-famlabels"
                class="form-check-input"
                type="checkbox"
                [checked]="spec.famlabels ?? false"
                (change)="setFlag('famlabels', $event)"
              />
              <label class="form-check-label" for="figure-famlabels"
                >Number the families</label
              >
            </div>
            <div class="form-check mb-2">
              <input
                id="figure-legend"
                class="form-check-input"
                type="checkbox"
                [checked]="spec.legend ?? true"
                (change)="setFlag('legend', $event)"
              />
              <label class="form-check-label" for="figure-legend">Legend</label>
            </div>
          </section>
          <section class="figure-section">
            <h6>Labels</h6>
            <select
              id="figure-labels"
              class="form-select form-select-sm mb-1"
              (change)="
                update({
                  labels: value($event) === 'short' ? 'short' : undefined,
                })
              "
            >
              <option value="full" [selected]="spec.labels !== 'short'">
                Chromosome and span
              </option>
              <option value="short" [selected]="spec.labels === 'short'">
                Chromosome only
              </option>
            </select>
            <div class="form-check">
              <input
                id="figure-names"
                class="form-check-input"
                type="checkbox"
                [checked]="spec.names ?? false"
                (change)="setFlag('names', $event)"
              />
              <label class="form-check-label" for="figure-names"
                >Gene names</label
              >
            </div>
            <div class="form-check mb-2">
              <input
                id="figure-cap"
                class="form-check-input"
                type="checkbox"
                [checked]="spec.cap ?? false"
                (change)="setFlag('cap', $event)"
              />
              <label class="form-check-label" for="figure-cap"
                >Print the caption</label
              >
            </div>
          </section>
          <section class="figure-section">
            <h6>Marks</h6>
            <label class="form-label mb-1" for="figure-mark-em"
              >Emphasise genes, comma-separated</label
            >
            <input
              id="figure-mark-em"
              class="form-control form-control-sm mb-1"
              placeholder="none"
              [value]="(spec.em ?? []).join(', ')"
              (change)="setEmphasis($event)"
            />
            <label class="form-label mb-1" for="figure-mark-names"
              >Names, one per line: gene = name</label
            >
            <textarea
              id="figure-mark-names"
              class="form-control form-control-sm mb-1"
              rows="2"
              placeholder="Glyma.19G194300 = Dt1"
              [value]="markLines('name')"
              (change)="setMarks('name', $event)"
            ></textarea>
            <label class="form-label mb-1" for="figure-mark-spans"
              >Spans, one per line: gene ~ gene = label</label
            >
            <textarea
              id="figure-mark-spans"
              class="form-control form-control-sm mb-1"
              rows="2"
              [value]="markLines('span')"
              (change)="setMarks('span', $event)"
            ></textarea>
            <label class="form-label mb-1" for="figure-mark-positions"
              >Positions, one per line: chromosome:position = label</label
            >
            <textarea
              id="figure-mark-positions"
              class="form-control form-control-sm mb-1"
              rows="2"
              [value]="markLines('pos')"
              (change)="setMarks('pos', $event)"
            ></textarea>
            @if (markErrors.length > 0) {
              <ul class="text-danger small ps-3 mb-1" data-mark-errors>
                @for (error of markErrors; track error) {
                  <li>{{ error }}</li>
                }
              </ul>
            }
          </section>
          <section class="figure-section">
            <h6>Size</h6>
            <label class="form-label mb-1" for="figure-w">Width (mm)</label>
            <input
              id="figure-w"
              class="form-control form-control-sm mb-1"
              type="number"
              list="figure-widths"
              [min]="limits.w[0]"
              [max]="limits.w[1]"
              placeholder="180"
              [value]="spec.w ?? ''"
              (change)="setNumber('w', $event)"
            />
            <datalist id="figure-widths">
              <option value="85"></option>
              <option value="120"></option>
              <option value="180"></option>
            </datalist>
            <label class="form-label mb-1" for="figure-font">Text (pt)</label>
            <input
              id="figure-font"
              class="form-control form-control-sm mb-1"
              type="number"
              step="0.5"
              [min]="limits.font[0]"
              [max]="limits.font[1]"
              placeholder="7"
              [value]="spec.font ?? ''"
              (change)="setNumber('font', $event)"
            />
            <label class="form-label mb-1" for="figure-glyph">Genes (mm)</label>
            <input
              id="figure-glyph"
              class="form-control form-control-sm"
              type="number"
              step="0.5"
              [min]="limits.glyph[0]"
              [max]="limits.glyph[1]"
              placeholder="fitted"
              [value]="spec.glyph ?? ''"
              (change)="setNumber('glyph', $event)"
            />
          </section>
        </form>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class FigureComponent implements AfterViewInit, OnDestroy {
  private _cd = inject(ChangeDetectorRef);
  private _familyService = inject(FamilyService);
  private _geneService = inject(GeneService);
  private _microTracksService = inject(MicroTracksService);
  private _paramsService = inject(ParamsService);

  // null when the figure's gene is in no one cluster
  @Input() clusterID: number | null;
  @Output() closed = new EventEmitter<void>();

  @ViewChild('preview') preview: ElementRef<HTMLElement>;

  readonly limits = FIGURE_LIMITS;
  spec: ParsedFigureSpec = {};
  svg: SVGSVGElement | undefined;
  manifest: FigureManifest | undefined;
  notes: string[] = [];
  // genes' coordinates are still loading, so the figure isn't final
  loading = false;
  clusterChoices: { cluster: number; gene: string }[] = [];
  // the lines of the marks' fields that couldn't be read
  markErrors: string[] = [];
  // the cluster's result tracks, ticked as the spec chooses them
  trackOptions: TrackOption[] = [];
  // merging named pairs, before any pair is named
  choosingPairs = false;
  mergeErrors: string[] = [];
  // the PNG's resolution, an export choice rather than the figure's
  dpi = PNG_DPI;
  readonly dpiLimits = PNG_DPI_LIMITS;
  // each drawing, for agents to wait on and read
  readonly rendered = new BehaviorSubject<FigureRender | null>(null);

  private _destroy = new Subject<void>();

  ngAfterViewInit(): void {
    // the form shows, and changes build on, the URL's spec from the start,
    // not only once the view's data has drawn the figure
    this._paramsService
      .getFigureParams()
      .pipe(takeUntil(this._destroy))
      .subscribe(({ fig }) => {
        this.spec = fig ?? {};
        this._cd.detectChanges();
      });
    const query = this._microTracksService.getQueryAlignment();
    const tracks = this._microTracksService.getAllTracks();
    const cluster = (all: AlignedTrack[]) =>
      all.filter((t) => t.cluster === this.clusterID);
    const genes = tracks.pipe(
      switchMap((all) =>
        this.clusterID === null
          ? of([])
          : this._geneService.getGenesForTracks(cluster(all)),
      ),
    );
    combineLatest([
      query,
      tracks,
      genes,
      this._familyService.selectOmittedFamilies(),
      this._paramsService.getFigureParams().pipe(map(({ fig }) => fig)),
      this._paramsService.getParams(),
      this._geneService.getQueryGenes(),
    ])
      .pipe(debounceTime(100), takeUntil(this._destroy))
      .subscribe(([query, all, genes, omitted, fig, params, queryGenes]) => {
        this.spec = fig ?? {};
        this.clusterChoices = Array.from(
          new Set(query.tracks.map((t) => t.cluster)),
        ).map((c) => ({
          cluster: c,
          gene: query.tracks.find((t) => t.cluster === c).genes[0],
        }));
        const drawnFor = serializeFigureSpec(this.spec);
        if (this.clusterID === null) {
          this._cd.detectChanges();
          this.rendered.next({
            fig: drawnFor,
            cluster: null,
            notes: [],
            choices: this.clusterChoices,
          });
          return;
        }
        const clusterTracks = cluster(all);
        const { data } = microShim(
          this.clusterID,
          query.tracks,
          all,
          genes,
          omitted,
        );
        const [alignment] = clusterAlignments(
          query.consensuses,
          clusterTracks,
          new Set(query.tracks),
          new Map(genes.map((g) => [geneID(g.name, g.source), g])),
        );
        if (alignment === undefined) {
          this.svg = undefined;
          this.notes = [`The view has no cluster ${this.clusterID}.`];
          this._cd.detectChanges();
          this.rendered.next({
            fig: drawnFor,
            cluster: this.clusterID,
            notes: this.notes,
          });
          return;
        }
        const model = figureModel({
          drawn: data,
          alignment,
          sameLocus: sameLocusTracks([alignment]),
          spec: this.spec,
        });
        const queryNames = new Set(
          alignment.tracks
            .filter((t) => t.role === 'query')
            .flatMap((t) => t.genes.map((g) => g.name)),
        );
        const url = document.location.href;
        const date = new Date().toISOString().slice(0, 10);
        const caption = figureCaption(model.manifest, {
          queryGenes: queryGenes
            .map((g) => g.name)
            .filter((g) => queryNames.has(g)),
          params,
          url,
          version: GCV_VERSION,
          date,
        });
        this.manifest = model.manifest;
        this.trackOptions = model.trackOptions;
        this.notes = model.notes;
        this.loading = model.loading;
        this.svg = GCV.visualization.drawMicroFigure(
          {
            ...model.figure,
            caption,
            metadata: { url, parameters: params, version: GCV_VERSION, date },
          },
          document,
          measureText,
        );
        this._cd.detectChanges();
        this.preview?.nativeElement.replaceChildren(this.svg);
        // as large as fits the preview, in the figure's proportions
        const [, , width, height] = this.svg
          .getAttribute('viewBox')
          .split(' ')
          .map(Number);
        this.svg.style.width = `min(100cqw, calc(100cqh * ${width / height}))`;
        this.svg.style.height = 'auto';
        this.rendered.next({
          fig: drawnFor,
          cluster: this.clusterID,
          manifest: model.manifest,
          notes: model.notes,
          caption,
          loading: model.loading,
        });
      });
  }

  ngOnDestroy(): void {
    this._destroy.next();
    this._destroy.complete();
    this.rendered.complete();
    this.closed.emit();
  }

  // the spec

  update(change: Partial<FigureSpec>): void {
    const spec: FigureSpec = { ...this.spec, ...change };
    delete (spec as ParsedFigureSpec).rejected;
    Object.keys(spec).forEach((k) => {
      if (spec[k] === undefined) delete spec[k];
    });
    this._paramsService.updateFigure(spec);
  }

  value(event: Event): string {
    return (event.target as HTMLInputElement).value.trim();
  }

  setNumber(key: 'top' | 'w' | 'font' | 'glyph', event: Event): void {
    const value = this.value(event);
    this.update({ [key]: value === '' ? undefined : Number(value) });
  }

  setList(key: 'genus' | 'colour', event: Event): void {
    const items = this.value(event)
      .split(/[,+]/)
      .map((i) => i.trim())
      .filter((i) => i !== '');
    this.update({ [key]: items.length > 0 ? items : undefined });
  }

  // the tracks

  chosenTracks(): number {
    return this.trackOptions.filter((o) => o.chosen).length;
  }

  // ticking a track names every ticked track, which replaces top and genus
  setTrack(option: TrackOption, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const tracks = this.trackOptions
      .filter((o) => (o === option ? checked : o.chosen))
      .map((o) => o.gene);
    this.update({ tracks: tracks.length > 0 ? tracks : undefined });
  }

  orderChoice(): 'view' | 'score' | 'genus' {
    const order = this.spec.order;
    return order === undefined || order === 'view'
      ? 'view'
      : order === 'score'
        ? 'score'
        : 'genus';
  }

  // the genera to order by: the spec's, or else the genera kept, as shown
  orderGenera(): string[] {
    const order = this.spec.order;
    if (order !== undefined && order !== 'view' && order !== 'score') {
      return order.genera;
    }
    return (
      this.spec.genus ??
      Array.from(
        new Set(this.trackOptions.filter((o) => o.chosen).map((o) => o.genus)),
      )
    );
  }

  setOrder(event: Event): void {
    const choice = this.value(event);
    const genera = this.orderGenera();
    this.update({
      order:
        choice === 'score'
          ? 'score'
          : choice === 'genus' && genera.length > 0
            ? { genera }
            : undefined,
    });
  }

  setOrderGenera(event: Event): void {
    const genera = this.value(event)
      .split(/[,+]/)
      .map((g) => g.trim())
      .filter((g) => g !== '');
    this.update({ order: genera.length > 0 ? { genera } : undefined });
  }

  mergeChoice(): 'none' | 'both' | 'pairs' {
    const merge = this.spec.merge;
    return merge === 'both'
      ? 'both'
      : merge !== undefined || this.choosingPairs
        ? 'pairs'
        : 'none';
  }

  setMerge(event: Event): void {
    const choice = this.value(event);
    this.choosingPairs = choice === 'pairs';
    this.mergeErrors = [];
    this.update({ merge: choice === 'both' ? 'both' : undefined });
  }

  mergeLines(): string {
    const merge = this.spec.merge;
    return Array.isArray(merge)
      ? merge.map(([a, b]) => `${a} / ${b}`).join('\n')
      : '';
  }

  setMergePairs(event: Event): void {
    const errors: string[] = [];
    const pairs = (event.target as HTMLTextAreaElement).value
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l !== '')
      .flatMap((line): [string, string][] => {
        const genes = line.split('/').map((g) => g.trim());
        if (genes.length === 2 && genes.every((g) => g !== '')) {
          return [genes as [string, string]];
        }
        errors.push(`Couldn't read “${line}”.`);
        return [];
      });
    this.mergeErrors = errors;
    this.choosingPairs = true;
    this.update({ merge: pairs.length > 0 ? pairs : undefined });
  }

  setCrop(end: 0 | 1, event: Event): void {
    const crop: [string, string] = [...(this.spec.crop ?? ['', ''])] as [
      string,
      string,
    ];
    crop[end] = this.value(event);
    this.update({ crop: crop.every((g) => g !== '') ? crop : undefined });
  }

  // the marks

  setEmphasis(event: Event): void {
    const genes = this.value(event)
      .split(',')
      .map((g) => g.trim())
      .filter((g) => g !== '');
    this.update({ em: genes.length > 0 ? genes : undefined });
  }

  // a kind of mark as its field shows it, one per line
  markLines(kind: 'name' | 'span' | 'pos'): string {
    const label = (text?: string) => (text !== undefined ? ` = ${text}` : '');
    switch (kind) {
      case 'name':
        return (this.spec.name ?? [])
          .map((n) => `${n.gene}${label(n.text)}`)
          .join('\n');
      case 'span':
        return (this.spec.span ?? [])
          .map((sp) => `${sp.from} ~ ${sp.to}${label(sp.text)}`)
          .join('\n');
      case 'pos':
        return (this.spec.pos ?? [])
          .map((p) => `${p.chromosome}:${p.position}${label(p.text)}`)
          .join('\n');
    }
  }

  setMarks(kind: 'name' | 'span' | 'pos', event: Event): void {
    const errors: string[] = [];
    const lines = (event.target as HTMLTextAreaElement).value
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l !== '');
    // 'head = text', the text optional
    const split = (line: string) => {
      const i = line.indexOf('=');
      return i === -1
        ? { head: line, text: undefined }
        : {
            head: line.slice(0, i).trim(),
            text: line.slice(i + 1).trim() || undefined,
          };
    };
    const marks = lines.flatMap((line): object[] => {
      const { head, text } = split(line);
      if (kind === 'name') {
        if (head !== '' && text !== undefined) return [{ gene: head, text }];
      } else if (kind === 'span') {
        const ends = head.split('~').map((g) => g.trim());
        if (ends.length === 2 && ends.every((g) => g !== '')) {
          return [{ from: ends[0], to: ends[1], ...(text ? { text } : {}) }];
        }
      } else {
        const m = head.match(/^(.+):(\d+)$/);
        if (m !== null && Number(m[2]) >= 1) {
          return [
            {
              chromosome: m[1],
              position: Number(m[2]),
              ...(text ? { text } : {}),
            },
          ];
        }
      }
      errors.push(`Couldn't read “${line}”.`);
      return [];
    });
    this.markErrors = errors;
    this.update({ [kind]: marks.length > 0 ? marks : undefined });
  }

  setFlag(key: 'famlabels' | 'legend' | 'names' | 'cap', event: Event): void {
    this.update({ [key]: (event.target as HTMLInputElement).checked });
  }

  setDpi(event: Event): void {
    const dpi = Number(this.value(event));
    const [min, max] = PNG_DPI_LIMITS;
    this.dpi =
      Number.isInteger(dpi) && dpi >= min && dpi <= max ? dpi : PNG_DPI;
    (event.target as HTMLInputElement).value = String(this.dpi);
  }

  // downloads

  // the figure's SVG as a file holds it; undefined while there is none
  svgText(): string | undefined {
    if (this.svg === undefined) return undefined;
    return new XMLSerializer().serializeToString(this._exported());
  }

  downloadSvg(): { name: string; bytes: number } | undefined {
    if (this.svg === undefined) return undefined;
    return saveFile(
      'micro-synteny-figure-',
      this.svgText(),
      'image/svg+xml',
      'svg',
    );
  }

  async downloadPng(
    dpi = PNG_DPI,
  ): Promise<{ name: string; bytes: number } | undefined> {
    if (this.svg === undefined) return undefined;
    const svg = this._exported();
    const xml = new XMLSerializer().serializeToString(svg);
    const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml' }));
    try {
      const image = new Image();
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = url;
      });
      const [, , width, height] = svg
        .getAttribute('viewBox')
        .split(' ')
        .map(Number);
      // the viewBox is in px at 96 per inch
      const scale = dpi / 96;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      canvas
        .getContext('2d')
        .drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob(resolve, 'image/png'),
      );
      return saveFile('micro-synteny-figure-', blob, 'image/png', 'png');
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  // the figure as drawn, without the preview's sizing
  private _exported(): SVGSVGElement {
    const svg = this.svg.cloneNode(true) as SVGSVGElement;
    svg.removeAttribute('style');
    return svg;
  }
}
