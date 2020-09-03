// Angular + dependencies
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy,
  OnInit, Output, ViewChild } from '@angular/core';
import { Subject, combineLatest } from 'rxjs';
import { filter, map, mergeAll, switchMap, takeUntil } from 'rxjs/operators';
// app
import { GCV } from '@gcv-assets/js/gcv';
import { saveFile } from '@gcv/core/utils';
import { Pipeline } from '@gcv/gene/models';
import { blockIndexMap, endpointGenes, nameSourceID }
  from '@gcv/gene/models/shims';
import { ChromosomeService, GeneService, MicroTracksService,
  PairwiseBlocksService, ParamsService, ProcessService, RegionService }
  from '@gcv/gene/services';
import { getMacroColors } from '@gcv/gene/utils';
// component
import { macroShim } from './macro.shim';


@Component({
  selector: 'gcv-macro',
  styleUrls: ['../golden-viewer.scss'],
  template: `
    <gcv-context-menu (saveImage)="saveImage()">
      <gcv-pipeline [info]=info [pipeline]=pipeline navcenter></gcv-pipeline>
    </gcv-context-menu>
    <div (gcvOnResize)="draw()" class="viewer" #container></div>
  `,
})
export class MacroComponent implements AfterViewInit, OnDestroy, OnInit {

  // IO

  @Input() name: string;
  @Input() source: string;
  @Input() clusterID: number;
  @Input() options: any = {};
  @Output() blockOver = new EventEmitter();

  @ViewChild('container', {static: true}) container: ElementRef;

  // variables

  draw = () => { /* no-op */ };

  info = `<p>This is the macro synteny <i>pipeline</i>.
          It depicts the flow of data from one <i>process</i> to the next for
          <u>this</u> macro synteny viewer.</p>
          <p class="mb-0">
          <b>Blocks</b> computes pairwise macro synteny blocks between this
          viewer's chromosome and other chromosomes in the database.
          <br>
          <b>Positions</b> fetches the physical positions of the computed blocks
          on the chromosomes.
          </p>`
  pipeline: Pipeline;

  private _destroy: Subject<boolean> = new Subject();
  private _viewer;

  // constructor

  constructor(private _chromosomeService: ChromosomeService,
              private _geneService: GeneService,
              private _microTracksService: MicroTracksService,
              private _pairwiseBlocksService: PairwiseBlocksService,
              private _paramsService: ParamsService,
              private _processService: ProcessService,
              private _regionService: RegionService) { }

  // Angular hooks

  ngOnInit() {
    const chromosomes = [{name: this.name, source: this.source}];
    this.pipeline = {
        'Blocks': this._processService.getMacroBlockProcess(chromosomes),
        'Positions': this._processService
          .getMacroBlockPositionProcess(chromosomes),
      };
  }

  ngAfterViewInit() {
    const queryID = nameSourceID(this.name, this.source);
    const queryTrack = this._microTracksService.getSelectedTracks()
      .pipe(
        mergeAll(),
        filter((t) => nameSourceID(t.name, t.source) == queryID));
    const clusterTracks = this._microTracksService.getCluster(this.clusterID);
    const queryChromosome = this._chromosomeService.getSelectedChromosomes()
      .pipe(
        mergeAll(),
        filter((c) => nameSourceID(c.name, c.source) == queryID));
    const sourceParams = this._paramsService.getSourceParams();
    const blockParams = this._paramsService.getBlockParams();
    const pairwiseBlocks =
      combineLatest(queryChromosome, sourceParams, blockParams).pipe(
        switchMap(([chromosome, sources, params]) => {
          const _sources = sources.sources;
          return this._pairwiseBlocksService
            .getPairwiseBlocksForTracks([chromosome], _sources, params);
        }),
      );
    const blockGenes =
      combineLatest(queryTrack, queryChromosome, pairwiseBlocks).pipe(
        map(([query, chromosome, blocks]) => {
          const chromosomeGeneIndexes = blockIndexMap(blocks);
          // create chromosome copies that only contain index gene
          const id = nameSourceID(chromosome.name, chromosome.source);
          const geneChromosome =
            endpointGenes(chromosome, chromosomeGeneIndexes[id]);
          return [query, geneChromosome];
        }),
        switchMap((tracks) => {
          return this._geneService.getGenesForTracks(tracks);
        }),
      );
    combineLatest(
      queryChromosome,
      queryTrack,
      clusterTracks,
      pairwiseBlocks,
      blockGenes
    )
      .pipe(takeUntil(this._destroy))
      .subscribe(([chromosome, query, tracks, blocks, genes]) => {
        this._preDraw(chromosome, query, tracks, blocks, genes);
        this.draw();
      });
  }

  ngOnDestroy() {
    this._destroy.next(true);
    this._destroy.complete();
    this._destroyViewer();
  }

  // private

  private _viewportDrag(start, stop) {
    this._regionService.regionSearch(this.name, start, stop, this.source);
  }

  private _destroyViewer(): void {
    if (this._viewer !== undefined) {
      this._viewer.destroy();
      this._viewer = undefined;
    }
  }

  private _preDraw(chromosome, query, tracks, blocks, genes): void {
    const {data, viewport, highlight} =
      macroShim(chromosome, query, tracks, blocks, genes);
    const colors = getMacroColors([chromosome]);
    let options = {
        colors,
        viewport,
        highlight,
        blockOver: (e, t, i, b, j) => {
          const pairwiseBlocks = blocks[i];
          // NOTE: this is sloppy; is there a better way to get the block?
          const block = pairwiseBlocks.blocks.find((block) => {
              return (b.start == block.fmin && b.stop == block.fmax) ||
                     (b.start == block.fmax && b.stop == block.fmin);
            });
          this.emitBlockOver(e, pairwiseBlocks, block);
        },
        viewportDrag: (e, start, stop) => this._viewportDrag(start, stop),
      };
    options = Object.assign(options, this.options, {autoResize: false});
    this.draw = this._draw.bind(this, data, options);
  }

  private _draw(data, options) {
    this._destroyViewer();
    const dim = Math.min(
        this.container.nativeElement.clientWidth,
        this.container.nativeElement.clientHeight
      );
    if (dim > 0) {
      this._viewer = new GCV.visualization.Macro(
        this.container.nativeElement,
        data,
        options);
    }
  }

  // public

  emitBlockOver(event, pairwiseBlocks, block) {
    this.blockOver.emit({event, pairwiseBlocks, block});
  }

  saveImage(): void {
    if (this._viewer !== undefined) {
      saveFile('macro', this._viewer.xml(), 'image/svg+xml', 'svg');
    }
  }
}
