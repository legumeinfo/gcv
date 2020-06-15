// Angular
import { OnInit, Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, map, mergeAll, switchMap } from 'rxjs/operators';
// app
import { arrayFlatten } from '@gcv/core/utils';
import { PairwiseBlock, PairwiseBlocks } from '@gcv/gene/models';
import { endpointGenes, nameSourceID } from '@gcv/gene/models/shims';
import { ChromosomeService, GeneService } from '@gcv/gene/services';


@Component({
  selector: 'gcv-macro-block-tooltip',
  template: `
    <!--
    <b>{{ pairwiseBlocks.reference }}</b> ({{ pairwiseBlocks.referenceSource }})
    <div *ngIf="referenceInterval|async; let interval">
      {{ interval.fmin }}-{{ interval.fmax }}
    </div>
    -->
    <b>{{ pairwiseBlocks.chromosome }}</b> ({{ pairwiseBlocks.chromosomeSource }})
    <div>
      {{ block.fmin }}-{{ block.fmax }}
    </div>
  `,
})
export class MacroBlockTooltipComponent implements OnInit {

  @Input() pairwiseBlocks: PairwiseBlocks;
  @Input() block: PairwiseBlock;

  referenceInterval: Observable<{fmin: number, fmax: number}>;

  constructor(private _chromosomeService: ChromosomeService,
              private _geneService: GeneService) { }

  // Angular hooks

  ngOnInit() {
    const {reference, referenceSource} = this.pairwiseBlocks;
    const referenceID = nameSourceID(reference, referenceSource);
    this.referenceInterval =
      this._chromosomeService.getSelectedChromosomes().pipe(
        mergeAll(),
        filter((c) => referenceID == nameSourceID(c.name, c.source)),
        map((c) => endpointGenes(c, [this.block.i, this.block.j])),
        switchMap((c) => {
          return this._geneService.getGenesForTracks([c]).pipe(
            map((genes) => {
              const geneLoci = genes.map((g) => [g.fmin, g.fmax]);
              const geneLociPoints = arrayFlatten(geneLoci);
              const fmin = Math.min(...geneLociPoints);
              const fmax = Math.max(...geneLociPoints);
              return {fmin, fmax};
            }),
          );
        }),
      );
  }

}
