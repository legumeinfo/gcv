// Angular
import { Component } from '@angular/core';
import { Router } from '@angular/router';
// app
import { AppConfig, Server } from '@gcv/core/models';


@Component({template: ''})
export class AbstractSearchWidgetComponent {

  model: any;
  sources: Server[];

  constructor(protected _appConfig: AppConfig, protected router: Router) {
    this.model = {
      query: '',
      sources: _appConfig.servers
                 .filter((s) => s.hasOwnProperty('search'))
                 .map((s) => s.id),
    };
    this.sources = _appConfig.servers.filter((s) => s.hasOwnProperty('search'));
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
