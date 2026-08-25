// Angular
import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
// NgRx
import { filter, map } from 'rxjs/operators';
// app
import { AppConfig, Server } from '@gcv/core/models';

@Component({
  template: '',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class AbstractSearchWidgetComponent implements OnInit {
  protected _appConfig = inject(AppConfig);
  protected _activatedRoute = inject(ActivatedRoute);
  protected router = inject(Router);

  model: any;
  sources: Server[];

  constructor() {
    const _appConfig = this._appConfig;

    this.model = {
      query: '',
      sources: _appConfig.servers
        .filter((s) => Object.prototype.hasOwnProperty.call(s, 'search'))
        .map((s) => s.id),
    };
    this.sources = _appConfig.servers.filter((s) =>
      Object.prototype.hasOwnProperty.call(s, 'search'),
    );
  }

  ngOnInit(): void {
    this._activatedRoute.queryParams
      .pipe(
        filter((queryParams) => 'q' in queryParams),
        map((queryParams) => queryParams['q']),
      )
      .subscribe((query) => {
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
