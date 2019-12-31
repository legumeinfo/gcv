// Angular
import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild }
  from '@angular/core';
import { Subject, combineLatest } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';
// app
import { GCV } from '@gcv-assets/js/gcv';
import { saveFile } from '@gcv/core/utils';
import { Track } from '@gcv/gene/models';
import { blockIndexMap, endpointGenes, nameSourceID }
  from '@gcv/gene/models/shims';
import { ChromosomeService, GeneService, MicroTracksService,
  PairwiseBlocksService, ParamsService } from '@gcv/gene/services';
import { getMacroColors } from '@gcv/gene/utils';
// component
import { macroCircosShim } from './macro-circos.shim';


@Component({
  selector: 'macro-circos',
  styleUrls: ['../golden-viewer.scss'],
  template: `
    <context-menu (saveImage)="saveImage()"></context-menu>
    <div class="viewer" #container></div>
  `,
})
export class MacroCircosComponent implements AfterViewInit, OnDestroy {

  @Input() clusterID: number;
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
    const queryTracks = this._microTracksService
      .getSelectedClusterTracks(this.clusterID);
    const queryChromosomes = this._chromosomeService
      .getSelectedChromosomesForCluster(this.clusterID);
    const sourceParams = this._paramsService.getSourceParams();
    const blockParams = this._paramsService.getBlockParams();
    const pairwiseBlocks =
      combineLatest(queryChromosomes, sourceParams, blockParams).pipe(
        switchMap(([chromosomes, sources, params]) => {
          const _sources = sources.sources;
          const targets = chromosomes.map((c) => c.name);
          return this._pairwiseBlocksService
            .getPairwiseBlocksForTracks(chromosomes, _sources, params, targets);
        }),
      );
    const blockGenes =
      combineLatest(queryTracks, queryChromosomes, pairwiseBlocks).pipe(
        map(([queries, chromosomes, blocks]) => {
          const chromosomeGeneIndexes = blockIndexMap(blocks);
          // create chromosome copies that only contain index gene
          const geneChromosomes = chromosomes
            .map((c) => {
              const id = nameSourceID(c.name, c.source);
              return endpointGenes(c, chromosomeGeneIndexes[id]);
            });
          return queries.concat(geneChromosomes);
        }),
        switchMap((tracks) => {
          return this._geneService.getGenesForTracks(tracks as Track[]);
        }),
      );
    combineLatest(queryTracks, queryChromosomes, pairwiseBlocks, blockGenes)
      .pipe(takeUntil(this._destroy))
      .subscribe(([queries, chromosomes, blocks, genes]) => {
        this._draw(queries, chromosomes, blocks, genes);
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

  private _draw(queries, chromosomes, blocks, genes): void {
    this._destroyViewer();
    const {data, highlight} =
      macroCircosShim(queries, chromosomes, blocks, genes);
    const colors = getMacroColors(chromosomes);
    let options = {colors, highlight};
    options = Object.assign(options, this.options);
    this._viewer = new GCV.visualization.MultiMacro(
      this.container.nativeElement,
      data,
      options,
    );
  }

  // public

  saveImage(): void {
    if (this._viewer !== undefined) {
      saveFile('macro-circos', this._viewer.xml(), 'image/svg+xml', 'svg');
    }
  }
}
