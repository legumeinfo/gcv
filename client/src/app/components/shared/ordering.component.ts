// Angular
import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";

// App services
import { ORDER_ALGORITHMS } from "../../constants/order-algorithms";
import { FilterService } from "../../services/filter.service";

@Component({
  moduleId: module.id.toString(),
  selector: "app-ordering",
  styles: [ ".input-group { display: inline; }" ],
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
export class OrderingComponent implements OnInit {

  algorithms = ORDER_ALGORITHMS;
  model: any = {order: this.algorithms[0].id};

  private ids = this.algorithms.map((a) => a.id);

  constructor(private filterService: FilterService) { }

  ngOnInit(): void {
    this.update();
  }

  update(): void {
    const idx = this.ids.indexOf(this.model.order);
    if (idx !== -1) {
      this.filterService.setOrder(this.model.order);
    }
  }
}
