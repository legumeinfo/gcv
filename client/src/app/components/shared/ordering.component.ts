// Angular
import { Component } from "@angular/core";
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
export class OrderingComponent {

  algorithms = ORDER_ALGORITHMS;
  model: any = {order: this.algorithms[0].id};  // default: chromosome name

  constructor(private filterService: FilterService) {
    filterService.orderAlgorithm
      .subscribe((order) => this.model.order = order.id);
    this.update();
  }

  update(): void {
    this.filterService.setOrder(this.model.order);
  }
}
