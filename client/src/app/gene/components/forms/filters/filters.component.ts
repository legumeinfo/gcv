// Angular
import { Component } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
// app
import { ORDER_ALGORITHMS } from '@gcv/gene/algorithms';
import { Algorithm } from '@gcv/gene/models';
import { FilterService } from '@gcv/gene/services';


@Component({
  selector: 'filters',
  templateUrl: './filters.component.html',
})
export class FiltersComponent {

  orderAlgorithms = ORDER_ALGORITHMS;
  currentRegexp: Observable<string>;
  selectedOrderAlgorithm: Observable<Algorithm>;

  microHelp = false;

  private _destroy: Subject<boolean> = new Subject();

  constructor(private _filterService: FilterService) {
    this.currentRegexp = this._filterService.getRegexp();
    this.selectedOrderAlgorithm = this._filterService.getOrderAlgorithm();
  }

  // public

  updateRegexp(regexp: string): void {
    this._filterService.setRegexp(regexp);
  }

  updateOrder(id: string): void {
    this._filterService.setOrder(id);
  }

}
