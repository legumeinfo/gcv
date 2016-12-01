// Angular
import { ActivatedRoute }               from '@angular/router';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router }                       from '@angular/router';

// App services
import { SORTING_ALGORITHMS } from '../../services/sorting-algorithms';

@Component({
  moduleId: module.id,
  selector: 'ordering',
  templateUrl: 'ordering.component.html',
  styles: [ '' ]
})

export class OrderingComponent implements OnDestroy, OnInit {
  algorithms = SORTING_ALGORITHMS;
  order = this.algorithms[0].id;

  private sub: any;
  private params: any;

  constructor(private route: ActivatedRoute,
              private router: Router) { }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  ngOnInit(): void {
    this.sub = this.route.queryParams.subscribe(params => {
      this.params = Object.assign({}, params);
      // update the selected ordering
      if (params['order'])
        this.order = params['order'];
      // order the tracks
      this.update();
    });
  }

  update(): void {
    this.router.navigate([], {queryParams: Object.assign(
      this.params,
      {order: this.order}
    )});
  }
}
