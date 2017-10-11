// Angular
import { Component,
         ElementRef,
         OnDestroy,
         OnInit,
         ViewChild } from '@angular/core';

// App services
import { FilterService }         from '../../services/filter.service';
import { ORDER_ALGORITHMS }      from '../../constants/order-algorithms';
import { UrlQueryParamsService } from '../../services/url-query-params.service';

declare var $: any;

@Component({
  moduleId: module.id,
  selector: 'app-ordering',
  template: `
    <form #orderForm="ngForm">
      <div class="input-group">
        <select class="form-control" id="order"
            (change)="update()"
            [(ngModel)]="model.order" name="order">
          <option *ngFor="let alg of algorithms" [value]="alg.id">{{alg.name}}</option>
        </select>
      </div>
    </form>
  `,
  styles: [ '.input-group { display: inline; }' ]
})

export class OrderingComponent implements OnDestroy, OnInit {

  algorithms = ORDER_ALGORITHMS;
  private _ids = this.algorithms.map(a => a.id);
  model: any = {order: this.algorithms[0].id};

  private _sub: any;

  constructor(private _filterService: FilterService,
              private _url: UrlQueryParamsService) { }

  ngOnDestroy(): void {
    this._sub.unsubscribe();
  }

  ngOnInit(): void {
    this._sub = this._url.params.subscribe(params => {
      if (params['order'])
        this.model.order = params['order'];
    });
    this.update();
  }

  update(): void {
    var idx = this._ids.indexOf(this.model.order);
    if (idx != -1) {
      this._filterService.setOrder(this.model.order);
      this._url.updateParams(this.model);
    }
  }
}
