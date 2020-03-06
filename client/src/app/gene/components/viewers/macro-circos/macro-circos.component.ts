// Angular
import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit,
  ViewChild } from '@angular/core';
import { Subject, combineLatest } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';
// app
import { GCV } from '@gcv-assets/js/gcv';
import { saveFile } from '@gcv/core/utils';
import { Pipeline, Track } from '@gcv/gene/models';
import { blockIndexMap, endpointGenes, nameSourceID }
  from '@gcv/gene/models/shims';
import { ChromosomeService, GeneService, MicroTracksService,
  PairwiseBlocksService, ParamsService, ProcessService }
  from '@gcv/gene/services';
import { getMacroColors } from '@gcv/gene/utils';
// component
import { macroCircosShim } from './macro-circos.shim';


@Component({
  selector: 'macro-circos',
  styleUrls: ['../golden-viewer.scss'],
  template: `
    <context-menu (saveImage)="saveImage()">
      <pipeline [info]=info [pipeline]=pipeline navcenter></pipeline>
    </context-menu>
    <div class="viewer" #container></div>
  `,
})
export class MacroCircosComponent implements AfterViewInit, OnDestroy, OnInit {

  // IO

  @Input() clusterID: number;
  @Input() options: any = {};

  @ViewChild('container', {static: true}) container: ElementRef;

  // variables

  info = `<p>This is the circos <i>pipeline</i>.
          It depicts the flow of data from one <i>process</i> to the next for
          this circos viewer.</p>
          <p class="mb-0">
          <b>Blocks</b> computes pairwise macro synteny blocks between this
          viewer's chromosomes.
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
              private _processService: ProcessService) { }

  // Angular hooks

  ngOnInit() {
    this.pipeline = {
        'Blocks': this._processService.getMacroBlockProcess(this.clusterID),
        'Positions': this._processService
          .getMacroBlockPositionProcess(this.clusterID),
      };
  }

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
