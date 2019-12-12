// Angular
import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
// app
import { Gene } from '@gcv/gene/models';
import { GeneService } from '@gcv/gene/services';


@Component({
  selector: 'gene-tooltip',
  template: `
    <b>{{ gene }}</b> ({{ source }})
    <div *ngIf="instance|async; let g">
    {{ g.fmin }}-{{ g.fmax }}
  `,
})
export class GeneTooltipComponent implements OnInit {

  @Input() gene: string;
  @Input() source: string;

  instance: Observable<Gene>;

  constructor(private _geneService: GeneService) { }

  // Angular hooks

  ngOnInit(): void {
    this.instance = this._geneService.getGenes([this.gene], this.source)
      .pipe(map((genes) => genes[0]));
  }

}
