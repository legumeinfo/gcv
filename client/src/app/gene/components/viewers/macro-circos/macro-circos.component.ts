// Angular
import { Location } from '@angular/common';
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
  selector: 'gcv-macro-circos',
  styleUrls: ['../golden-viewer.scss'],
  template: `
    <gcv-context-menu (saveImage)="saveImage()">
      <gcv-pipeline [info]=info [pipeline]=pipeline navcenter></gcv-pipeline>
    </gcv-context-menu>
    <div (gcvOnResize)="draw()" class="viewer" #container></div>
  `,
})
export class MacroCircosComponent implements AfterViewInit, OnDestroy, OnInit {

  // IO

  @Input() clusterID: number;
  @Input() options: any = {};

  @ViewChild('container', {static: true}) container: ElementRef;

  // variables

  draw = () => { /* no-op */ };

  info = `<p>This is the circos <i>pipeline</i>.
          It depicts the flow of data from one <i>process</i> to the next for
          <u>this</u> circos viewer.</p>
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
              private _location: Location,
              private _microTracksService: MicroTracksService,
              private _pairwiseBlocksService: PairwiseBlocksService,
              private _paramsService: ParamsService,
              private _processService: ProcessService) { }

  // Angular hooks

  ngOnInit() {
    this.pipeline = {
        'Blocks': this._processService.getCircosBlockProcess(this.clusterID),
        'Positions': this._processService
          .getCircosBlockPositionProcess(this.clusterID),
      };
  }

  ngAfterViewInit() {
    const queryTracks = this._microTracksService
      .getSelectedClusterTracks(this.clusterID);
    const queryChromosomes = this._chromosomeService
      .getSelectedChromosomesForCluster(this.clusterID);
    const pairwiseBlocks =
      combineLatest(
        queryChromosomes,
        this._paramsService.getSourceParams(),
        this._paramsService.getBlockParams(),
      ).pipe(
        switchMap(([chromosomes, sourceParams, blockParams]) => {
          const sources = sourceParams.sources;
          const targets = chromosomes.map((c) => c.name);
          return this._pairwiseBlocksService
            .getPairwiseBlocksForTracks(
              chromosomes,
              sources,
              blockParams,
              targets,
            );
        }),
      );
    const blockGenes =
      combineLatest(queryTracks, queryChromosomes, pairwiseBlocks).pipe(
        map(([queries, chromosomes, blocks]) => {
          const chromosomeGeneIndexes = blockIndexMap(blocks);
          // create chromosome copies that only contain index genes
          const geneChromosomes = chromosomes
            .map((c) => {
              const id = nameSourceID(c.name, c.source);
              return endpointGenes(c, chromosomeGeneIndexes[id]);
            });
          return (queries as Track[]).concat(geneChromosomes);
        }),
        switchMap((tracks) => {
          return this._geneService.getGenesForTracks(tracks);
        }),
      );
    combineLatest(queryTracks, queryChromosomes, pairwiseBlocks, blockGenes)
      .pipe(takeUntil(this._destroy))
      .subscribe(([queries, chromosomes, blocks, genes]) => {
        this._preDraw(queries, chromosomes, blocks, genes);
        this.draw();
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
      this._viewer = undefined;
    }
  }

  private _preDraw(queries, chromosomes, blocks, genes): void {
    const {data, highlight} =
      macroCircosShim(queries, chromosomes, blocks, genes);
    const colors = getMacroColors(chromosomes);
    const absolutePath = this._location.prepareExternalUrl(this._location.path());
    let options = {colors, highlight, IRIprefix: absolutePath};
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
      this._viewer = new GCV.visualization.MultiMacro(
        this.container.nativeElement,
        data,
        options,
      );
    }
  }

  // public

  saveImage(): void {
    if (this._viewer !== undefined) {
      saveFile('macro-circos', this._viewer.xml(), 'image/svg+xml', 'svg');
    }
  }
}
