import { Component, OnDestroy, OnInit } from '@angular/core';
import { FilterService }                from '../../services/filter.service';
import { UrlQueryParamsService }        from '../../services/url-query-params.service';

@Component({
  moduleId: module.id,
  selector: 'app-regexp',
  template: `
    <form class="navbar-form navbar-left" (ngSubmit)="submit()" #regexpForm="ngForm">
      <div class="form-group">
        <input type="text" class="form-control" id="regexp"
          [(ngModel)]="model.regexp" name="regexp"
          #regexp="ngModel"
          placeholder="e.g. name1|name4|name2" >
      </div>
      <button type="submit" class="btn btn-default">Filter</button>
    </form>
  `,
  styles: [ '' ]
})

export class RegexpComponent implements OnDestroy, OnInit {
  model: any = {regexp: ''};

  private _sub: any;

  constructor(private _url: UrlQueryParamsService,
              private _filterService: FilterService) { }

  ngOnDestroy(): void {
    this._sub.unsubscribe();
  }

  ngOnInit(): void {
    this._sub = this._url.params.subscribe(params => {
      if (params['regexp'])
        this.model.regexp = params['regexp'];
    });
    this.submit();
  }

  submit(): void {
    this._filterService.setRegexp(this.model.regexp);
    this._url.updateParams(this.model);
  }
}
