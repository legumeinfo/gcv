// Angular
import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
// App services
import { ORDER_ALGORITHMS } from "../../algorithms";
import { FilterService } from "../../services";

@Component({
  selector: "app-ordering",
  styles: [ "" ],
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
})
export class OrderingComponent implements OnDestroy, OnInit {

  algorithms = ORDER_ALGORITHMS;
  model: any = {order: this.algorithms[0].id};  // default: chromosome name

  // emits when the component is destroyed
  private destroy: Subject<boolean>;

  constructor(private filterService: FilterService) {
    this.destroy = new Subject();
  }

  // Angular hooks

  ngOnInit(): void {
    this.filterService.orderAlgorithm
      .pipe(takeUntil(this.destroy))
      .subscribe((order) => this.model.order = order.id);
    this.update();
  }

  ngOnDestroy(): void {
    this.destroy.next(true);
  }

  // public methods

  update(): void {
    this.filterService.setOrder(this.model.order);
  }
}
