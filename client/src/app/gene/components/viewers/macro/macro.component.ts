// Angular + dependencies
import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild }
  from '@angular/core';
import { Subject, combineLatest } from 'rxjs';
import { filter, map, mergeAll, switchMap, takeUntil } from 'rxjs/operators';
// app
import { GCV } from '@gcv-assets/js/gcv';
import { saveFile } from '@gcv/core/utils';
import { blockIndexMap, endpointGenesShim, nameSourceID }
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
  @Input() options: any = {};

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
          const geneChromosome =
            endpointGenesShim(chromosome, chromosomeGeneIndexes);
          return [query, geneChromosome];
        }),
        switchMap((tracks) => {
          return this._geneService.getGenesForTracks(tracks);
        }),
      );
    combineLatest(queryChromosome, queryTrack, pairwiseBlocks, blockGenes)
      .pipe(takeUntil(this._destroy))
      .subscribe(([chromosome, query, blocks, genes]) => {
        this._draw(chromosome, query, blocks, genes);
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

  private _draw(chromosome, query, blocks, genes): void {
    this._destroyViewer();
    const {data, viewport} = macroShim(chromosome, query, blocks, genes);
    const colors = getMacroColors([chromosome]);
    let options = {colors, viewport};
    options = Object.assign(options, this.options);
    this._viewer = new GCV.visualization.Macro(
      this.container.nativeElement,
      data,
      options);
  }

  // public

  saveImage(): void {
    if (this._viewer !== undefined) {
      saveFile('macro', this._viewer.xml(), 'image/svg+xml', 'svg');
    }
  }
}
