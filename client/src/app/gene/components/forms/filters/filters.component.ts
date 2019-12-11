// Angular
import { Component } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
// app
import { ORDER_ALGORITHMS } from '@gcv/gene/algorithms';
import { FilterService } from '@gcv/gene/services';


@Component({
  selector: 'filters',
  templateUrl: './filters.component.html',
})
export class FiltersComponent {

  orderAlgorithms = ORDER_ALGORITHMS;
  currentRegexp: Observable<string>;
  selectedOrderAlgorithm: Observable<{id: string, name: string}>;

  microHelp = false;

  private _typingTimer;
  private _doneTypingInterval = 1000;  // 1 seconds
  private _destroy: Subject<boolean> = new Subject();

  constructor(private _filterService: FilterService) {
    this.currentRegexp = this._filterService.getRegexp();
    this.selectedOrderAlgorithm = this._filterService.getOrderAlgorithm();
  }

  // public

  updateRegexp(regexp: string): void {
    clearTimeout(this._typingTimer);
    this._typingTimer = setTimeout(() => {
      this._filterService.setRegexp(regexp);
    }, this._doneTypingInterval);
  }

  updateOrder(id: string): void {
    this._filterService.setOrder(id);
  }

}
