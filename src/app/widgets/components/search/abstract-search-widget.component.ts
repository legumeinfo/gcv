// Angular
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
// NgRx
import { filter, map } from 'rxjs/operators';
// app
import { AppConfig, Server } from '@gcv/core/models';


@Component({template: ''})
export class AbstractSearchWidgetComponent implements OnInit {

  model: any;
  sources: Server[];

  constructor(
    protected _appConfig: AppConfig,
    protected _activatedRoute: ActivatedRoute,
    protected router: Router,
  ) {
    this.model = {
      query: '',
      sources: _appConfig.servers
                 .filter((s) => s.hasOwnProperty('search'))
                 .map((s) => s.id),
    };
    this.sources = _appConfig.servers.filter((s) => s.hasOwnProperty('search'));
  }

  ngOnInit(): void {
    this._activatedRoute.queryParams.pipe(
      filter((queryParams) => 'q' in queryParams),
      map((queryParams) => queryParams['q']),
    ).subscribe((query) => {
      this.model.query = query;
    });
  }

  submit(): void {
    if (this.model.query != '') {
      const query = this.model.query;
      const sources = this.model.sources.join(',');
      const url = `/search?q=${query}&sources=${sources}`;
      this.router.navigateByUrl(url);
    }
  }

}
