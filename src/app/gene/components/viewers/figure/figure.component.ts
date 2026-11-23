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
import { FigureManifest, figureCaption, figureModel } from '@gcv/gene/figure';
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
      .figure-body {
        display: flex;
        flex: 1;
        min-height: 0;
      }
      .figure-preview {
        flex: 1;
        overflow: auto;
        padding: 0.5rem;
        background: #f3f3f3;
      }
      .figure-preview :first-child {
        background: #fff;
        box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
      }
      .figure-form {
        width: 17rem;
        flex: none;
        overflow-y: auto;
        padding: 0.5rem;
        border-left: 1px solid #dee2e6;
        font-size: 0.875rem;
      }
      .figure-notes {
        margin: 0;
        padding: 0.25rem 0.5rem 0.25rem 1.5rem;
        border-top: 1px solid #dee2e6;
        font-size: 0.8rem;
        max-height: 6rem;
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
            (click)="downloadPng()"
          >
            PNG
          </button>
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
        <div class="figure-body">
          <div class="figure-preview" #preview></div>
          <form class="figure-form" (submit)="$event.preventDefault()">
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
              [value]="(spec.genus ?? []).join(', ')"
              (change)="setList('genus', $event)"
            />
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
            <div class="form-check mb-2">
              <input
                id="figure-merge"
                class="form-check-input"
                type="checkbox"
                [checked]="spec.merge === 'both'"
                (change)="setMerge($event)"
              />
              <label class="form-check-label" for="figure-merge"
                >Merge tracks that names and coordinates show are one
                locus</label
              >
            </div>
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
            <h6 class="mt-2">Size</h6>
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
          </form>
        </div>
        @if (notes.length > 0) {
          <ul class="figure-notes" data-figure-notes>
            @for (note of notes; track note) {
              <li>{{ note }}</li>
            }
          </ul>
        }
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
  // each drawing, for agents to wait on and read
  readonly rendered = new BehaviorSubject<FigureRender | null>(null);

  private _destroy = new Subject<void>();

  ngAfterViewInit(): void {
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
        this.svg.style.width = '100%';
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
    const change: Partial<FigureSpec> = {
      [key]: items.length > 0 ? items : undefined,
    };
    // ordering by genus follows the genera listed
    if (key === 'genus' && this.orderChoice() === 'genus') {
      change.order = items.length > 0 ? { genera: items } : undefined;
    }
    this.update(change);
  }

  orderChoice(): 'view' | 'score' | 'genus' {
    const order = this.spec.order;
    return order === undefined || order === 'view'
      ? 'view'
      : order === 'score'
        ? 'score'
        : 'genus';
  }

  setOrder(event: Event): void {
    const choice = this.value(event);
    this.update({
      order:
        choice === 'score'
          ? 'score'
          : choice === 'genus'
            ? { genera: this.spec.genus ?? [] }
            : undefined,
    });
  }

  setMerge(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.update({ merge: checked ? 'both' : undefined });
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
