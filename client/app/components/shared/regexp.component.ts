import { AfterViewInit,
         Component,
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
    <form class="navbar-form navbar-left" (ngSubmit)="submit()" #regexpForm="ngForm">
      <div class="form-group">
        <input type="text" class="form-control" id="regexp"
          [(ngModel)]="model.regexp" name="regexp"
          #regexp="ngModel"
          placeholder="e.g. name1|name4|name2" >
      </div>
      <button type="submit" class="btn btn-default">Filter</button>
    </form>
    <ul class="nav navbar-nav">
      <li><a #help class="color" data-toggle="tooltip" data-placement="top" title="A regular expression that filters the micro-synteny tracks"><span class="glyphicon glyphicon-question-sign"></span></a></li>
    </ul>
  `,
  styles: [`
    form {
      padding-right: 0;
    }
    form button {
      margin-right: 0;
    }
    .color {
      color: #337ab7 !important;
    }
  `]
})

export class RegexpComponent implements AfterViewInit, OnDestroy, OnInit {
  @ViewChild('help') el: ElementRef;

  model: any = {regexp: ''};

  private _sub: any;

  constructor(private _url: UrlQueryParamsService,
              private _filterService: FilterService) { }

  ngAfterViewInit(): void {
    $(this.el.nativeElement).tooltip();
  }

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
