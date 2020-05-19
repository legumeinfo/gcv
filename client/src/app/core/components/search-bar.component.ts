// Angular
import { Component } from '@angular/core';
import { Router } from '@angular/router';
// App
import { AppConfig } from '@gcv/app.config';

@Component({
  selector: 'app-search-bar',
  styles: [`
    .select {
      width: auto;
      display: inline-block;
    }
    form button { margin-right: 0; }
  `],
  template: `
    <form (ngSubmit)="submit()" #searchForm="ngForm">
      <div class="input-group">
        <input type="text" class="form-control" id="query-search"
          [(ngModel)]="model.query" name="query"
          #search="ngModel"
          placeholder="{{placeholder}}" >
        <select class="custom-select" [(ngModel)]="model.source" name="source">
          <option *ngFor="let s of servers" [ngValue]="s">{{s.name}}</option>
        </select>
        <div class="input-group-append">
          <button class="btn btn-primary" type="submit">Search</button>
        </div>
      </div>
    </form>
  `,
})
export class SearchBarComponent {

  servers: any[] = AppConfig.SERVERS;
  model: any = {source: this.servers[0], query: ''};
  placeholder: string = AppConfig.MISCELLANEOUS.searchPlaceholder;

  constructor(private router: Router) { }

  submit(): void {
    const query = this.model.query.replace(':', '/').replace('..', '-');
    const url = '/search/' + this.model.source.id + '/' + query;
    this.router.navigateByUrl(url);
  }
}
