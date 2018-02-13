// Angular
import { Component, ElementRef, OnDestroy, OnInit,
  ViewChild } from "@angular/core";

// App
import { FilterService } from "../../services/filter.service";
import { UrlService } from "../../services/url.service";

@Component({
  moduleId: module.id.toString(),
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

  private sub: any;

  constructor(private url: UrlService,
              private filterService: FilterService) { }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  ngOnInit(): void {
    this.sub = this.url.urlQueryParams.subscribe((params) => {
      if (params.regexp) {
        this.model.regexp = params.regexp;
      }
    });
    this.submit();
  }

  submit(): void {
    this.filterService.setRegexp(this.model.regexp);
    // this.url.updateParams(this.model);
  }
}
