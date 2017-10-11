import { Component,
         ElementRef,
         OnDestroy,
         OnInit,
         ViewChild } from '@angular/core';
import { FilterService }                from '../../services/filter.service';
import { UrlQueryParamsService }        from '../../services/url-query-params.service';

declare var $: any;

@Component({
  moduleId: module.id,
  selector: 'app-regexp',
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
  styles: [ 'form button { margin-right: 0; }' ]
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
