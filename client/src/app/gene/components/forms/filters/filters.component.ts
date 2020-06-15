// Angular
import { Component } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
// app
import {
  MACRO_ORDER_ALGORITHMS, MACRO_ORDER_ALGORITHM_MAP,
  MICRO_ORDER_ALGORITHMS, MICRO_ORDER_ALGORITHM_MAP
} from '@gcv/gene/algorithms';
import { Algorithm } from '@gcv/gene/models';
import {
  MacroFilterParams, MacroOrderParams,
  MicroFilterParams, MicroOrderParams
} from '@gcv/gene/models/params';
import { ParamsService } from '@gcv/gene/services';


@Component({
  selector: 'gcv-filters',
  templateUrl: './filters.component.html',
})
export class FiltersComponent {

  // variables

  macroOrderAlgorithms = MACRO_ORDER_ALGORITHMS;
  currentMacroRegexp: Observable<string>;
  selectedMacroOrderAlgorithm: Observable<Algorithm>;
  badMacroRegexp = false;

  microOrderAlgorithms = MICRO_ORDER_ALGORITHMS;
  currentMicroRegexp: Observable<string>;
  selectedMicroOrderAlgorithm: Observable<Algorithm>;
  badMicroRegexp = false;

  macroHelp = false;
  microHelp = false;

  private _macroOrderMap = MACRO_ORDER_ALGORITHM_MAP;
  private _microOrderMap = MICRO_ORDER_ALGORITHM_MAP;
  private _destroy: Subject<boolean> = new Subject();

  // constructor

  constructor(private _paramsService: ParamsService) {
    this.currentMacroRegexp = this._paramsService.getMacroFilterParams()
      .pipe(map((params: MacroFilterParams) => params.bregexp));
    this.selectedMacroOrderAlgorithm = this._paramsService.getMacroOrderParams()
      .pipe(map((params: MacroOrderParams) => this._macroOrderMap[params.border]));
    this.currentMicroRegexp = this._paramsService.getMicroFilterParams()
      .pipe(map((params: MicroFilterParams) => params.regexp));
    this.selectedMicroOrderAlgorithm = this._paramsService.getMicroOrderParams()
      .pipe(map((params: MicroOrderParams) => this._microOrderMap[params.order]));
  }

  // public

  updateMacroRegexp(bregexp: string): void {
    try {
      new RegExp(bregexp);
      this.badMacroRegexp = false;
      this._paramsService.updateParams({bregexp});
    } catch (e) {
      this.badMacroRegexp = true;
    }
  }

  updateMacroOrder(border: string): void {
    this._paramsService.updateParams({border});
  }

  updateMicroRegexp(regexp: string): void {
    try {
      new RegExp(regexp);
      this.badMicroRegexp = false;
      this._paramsService.updateParams({regexp});
    } catch (e) {
      this.badMicroRegexp = true;
    }
  }

  updateMicroOrder(order: string): void {
    this._paramsService.updateParams({order});
  }

}
