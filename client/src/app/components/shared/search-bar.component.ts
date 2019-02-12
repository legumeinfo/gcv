// Angular
import { Component } from "@angular/core";
import { Router } from "@angular/router";

// App
import { AppConfig } from "../../app.config";

@Component({
  selector: "app-search-bar",
  styles: [`
    .select {
      width: auto;
      display: inline-block;
    }
    form button { margin-right: 0; }
  `],
  template: `
    <form (ngSubmit)="submit()" #geneSearchForm="ngForm">
      <div class="input-group">
        <input type="text" class="form-control" id="gene-search"
          [(ngModel)]="model.gene" name="gene"
          #geneSearch="ngModel"
          placeholder="{{placeholder}}" >
        <span class="input-group-btn">
          <select class="select form-control" [(ngModel)]="model.source" name="source">
            <option *ngFor="let s of servers" [ngValue]="s">{{s.name}}</option>
          </select>
        </span>
        <span class="input-group-btn">
          <button class="btn btn-default" type="submit">Search</button>
        </span>
      </div>
    </form>
  `,
})
export class SearchBarComponent {

  servers: any[] = AppConfig.SERVERS;
  model: any = {source: this.servers[0], gene: ""};
  placeholder: string = AppConfig.MISCELLANEOUS.searchPlaceholder;

  constructor(private router: Router) { }

  submit(): void {
    const url = "/search/" + this.model.source.id + "/" + this.model.gene;
    this.router.navigateByUrl(url);
  }
}
