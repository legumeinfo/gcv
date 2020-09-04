// Angular
import { Component } from '@angular/core';
import { Router } from '@angular/router';
// App
import { AppConfig } from '@gcv/app.config';


@Component({template: ''})
export class AbstractSearchWidgetComponent {

  model: any = {
    query: '',
    sources: AppConfig.SERVERS
               .filter((s) => s.hasOwnProperty('search'))
               .map((s) => s.id),
  };
  sources = AppConfig.SERVERS.filter((s) => s.hasOwnProperty('search'));

  constructor(private router: Router) { }

  submit(): void {
    if (this.model.query != '') {
      const query = this.model.query;
      const sources = this.model.sources.join(',');
      const url = `/search?q=${query}&sources=${sources}`;
      this.router.navigateByUrl(url);
    }
  }

}
