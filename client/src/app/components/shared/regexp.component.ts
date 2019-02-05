// Angular
import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
// App
import { FilterService } from "../../services";

@Component({
  selector: "app-regexp",
  styles: [ "form button { margin-right: 0; }" ],
  template: `
    <form (ngSubmit)="submit()" #regexpForm="ngForm">
      <div class="input-group">
        <input type="text" class="form-control" id="regexp"
          [(ngModel)]="model.regexp" name="regexp"
          #regexp="ngModel"
          placeholder="e.g. name1|name4|name2" >
        <span class="input-group-btn">
          <button class="btn btn-default" type="submit">Filter</button>
        </span>
      </div>
    </form>
  `,
})
export class RegexpComponent implements OnDestroy, OnInit {

  model: any = {regexp: ""};

  // emits when the component is destroyed
  private destroy: Subject<boolean>;

  constructor(private filterService: FilterService) {
    this.destroy = new Subject();
  }

  // Angular hooks

  ngOnInit(): void {
    this.filterService.regexpAlgorithm
      .pipe(takeUntil(this.destroy))
      .subscribe((regexp) => this.model.regexp = regexp.name);
  }

  ngOnDestroy(): void {
    this.destroy.next(true);
  }

  // public methods

  submit(): void {
    this.filterService.setRegexp(this.model.regexp);
  }
}
