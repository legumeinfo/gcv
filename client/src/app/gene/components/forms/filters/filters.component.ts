// Angular
import { Component } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { take } from 'rxjs/operators';
// app
import { MACRO_ORDER_ALGORITHMS, MICRO_ORDER_ALGORITHMS }
  from '@gcv/gene/algorithms';
import { FilterService } from '@gcv/gene/services';


@Component({
  selector: 'filters',
  templateUrl: './filters.component.html',
})
export class FiltersComponent {

  // variables

  macroOrderAlgorithms = MACRO_ORDER_ALGORITHMS;
  currentMacroRegexp: Observable<string>;
  selectedMacroOrderAlgorithm: Observable<{id: string, name: string}>;

  microOrderAlgorithms = MICRO_ORDER_ALGORITHMS;
  currentMicroRegexp: Observable<string>;
  selectedMicroOrderAlgorithm: Observable<{id: string, name: string}>;

  macroHelp = false;
  microHelp = false;

  private _typingTimer;
  private _doneTypingInterval = 1000;  // 1 seconds
  private _destroy: Subject<boolean> = new Subject();

  // constructor

  constructor(private _filterService: FilterService) {
    this.currentMacroRegexp = this._filterService.getMacroRegexp();
    this.selectedMacroOrderAlgorithm =
      this._filterService.getMacroOrderAlgorithm();
    this.currentMicroRegexp = this._filterService.getMicroRegexp();
    this.selectedMicroOrderAlgorithm =
      this._filterService.getMicroOrderAlgorithm();
  }

  // public

  updateMacroRegexp(regexp: string): void {
    clearTimeout(this._typingTimer);
    this._typingTimer = setTimeout(() => {
      this._filterService.setMacroRegexp(regexp);
    }, this._doneTypingInterval);
  }

  updateMacroOrder(id: string): void {
    this._filterService.setMacroOrder(id);
  }

  updateMicroRegexp(regexp: string): void {
    clearTimeout(this._typingTimer);
    this._typingTimer = setTimeout(() => {
      this._filterService.setMicroRegexp(regexp);
    }, this._doneTypingInterval);
  }

  updateMicroOrder(id: string): void {
    this._filterService.setMicroOrder(id);
  }

}
