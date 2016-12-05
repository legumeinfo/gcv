// Angular
import { Component, OnDestroy, OnInit } from '@angular/core';

// App services
import { ORDER_ALGORITHMS }    from '../../models/order-algorithms';
import { UrlQueryParamsService } from '../../services/url-query-params.service';

@Component({
  moduleId: module.id,
  selector: 'ordering',
  templateUrl: 'ordering.component.html',
  styles: [ '' ]
})

export class OrderingComponent implements OnDestroy, OnInit {
  algorithms = ORDER_ALGORITHMS;
  order = this.algorithms[0].id;

  private _sub: any;

  constructor(private _url: UrlQueryParamsService) { }

  ngOnDestroy(): void {
    this._sub.unsubscribe();
  }

  ngOnInit(): void {
    this._sub = this._url.params.subscribe(params => {
      // update the selected ordering
      if (params['order'])
        this.order = params['order'];
    });
    // order the tracks
    this.update();
  }

  update(): void {
    this._url.updateParams({order: this.order});
  }
}
