// Angular
import {
  Component,
  Input,
  OnInit,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
// app
import { Gene } from '@gcv/gene/models';
import { GeneService } from '@gcv/gene/services';

@Component({
  selector: 'gcv-gene-tooltip',
  template: `
    <b>{{ gene }}</b> ({{ source }})
    @if (instance | async; as g) {
      <div>{{ g.fmin }}-{{ g.fmax }}</div>
    } @else {
      <div>
        <i class="fas fa-circle-notch fa-spin"></i>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class GeneTooltipComponent implements OnInit {
  private _geneService = inject(GeneService);

  @Input() gene: string;
  @Input() source: string;

  instance: Observable<Gene>;

  // Angular hooks

  ngOnInit(): void {
    this.instance = this._geneService
      .getGenes([this.gene], this.source)
      .pipe(map((genes) => genes[0]));
  }
}
