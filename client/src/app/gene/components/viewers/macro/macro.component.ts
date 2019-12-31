// Angular + dependencies
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy,
  Output, ViewChild } from '@angular/core';
import { Subject, combineLatest } from 'rxjs';
import { filter, map, mergeAll, switchMap, takeUntil } from 'rxjs/operators';
// app
import { GCV } from '@gcv-assets/js/gcv';
import { saveFile } from '@gcv/core/utils';
import { blockIndexMap, endpointGenes, nameSourceID }
  from '@gcv/gene/models/shims';
import { ChromosomeService, GeneService, MicroTracksService,
  PairwiseBlocksService, ParamsService } from '@gcv/gene/services';
import { getMacroColors } from '@gcv/gene/utils';
// component
import { macroShim } from './macro.shim';


@Component({
  selector: 'macro',
  styleUrls: ['../golden-viewer.scss'],
  template: `
    <context-menu (saveImage)="saveImage()"></context-menu>
    <div class="viewer" #container></div>
  `,
})
export class MacroComponent implements AfterViewInit, OnDestroy {

  @Input() name: string;
  @Input() source: string;
  @Input() clusterID: number;
  @Input() options: any = {};
  @Output() blockOver = new EventEmitter();

  @ViewChild('container', {static: true}) container: ElementRef;

  private _destroy: Subject<boolean> = new Subject();
  private _viewer;

  constructor(private _chromosomeService: ChromosomeService,
              private _geneService: GeneService,
              private _microTracksService: MicroTracksService,
              private _pairwiseBlocksService: PairwiseBlocksService,
              private _paramsService: ParamsService) { }

  // Angular hooks

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
        this._draw(chromosome, query, tracks, blocks, genes);
      });
  }

  ngOnDestroy() {
    this._destroy.next(true);
    this._destroy.complete();
    this._destroyViewer();
  }

  // private

  private _destroyViewer(): void {
    if (this._viewer !== undefined) {
      this._viewer.destroy();
    }
  }

  private _draw(chromosome, query, tracks, blocks, genes): void {
    this._destroyViewer();
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
      };
    options = Object.assign(options, this.options);
    this._viewer = new GCV.visualization.Macro(
      this.container.nativeElement,
      data,
      options);
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
