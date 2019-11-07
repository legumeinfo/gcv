// Angular
import { Component,
  Input, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
// App
import { AppConfig } from '@gcv/app.config';
import { Server } from '@gcv/core/models';
import { GeneService } from '@gcv/gene/services';

@Component({
  selector: 'gene-detail',
  styles: [ '' ],
  template: `
    <h4>{{ gene }}</h4>
    <p *ngIf="familyTreeLink !== undefined">Family: <a href="{{ familyTreeLink }}">{{ family }}</a></p>
    <p><a [routerLink]="['/search', source, name]" queryParamsHandling="merge">Search for similar contexts</a></p>
    <ul>
      <li *ngFor="let link of links">
        <a href="{{ link.href }}">{{ link.text }}</a>
      </li>
    </ul>
  `,
})

export class GeneDetailComponent implements OnDestroy, OnInit {

  @Input() gene: string;
  @Input() family: string;
  @Input() source: string

  private _serverIDs = AppConfig.SERVERS.map(s => s.id);
  private _destroy: Subject<boolean> = new Subject();

  links: any[] = [];
  familyTreeLink: string = '';

  constructor(private _geneService: GeneService) { }

  // Angular hooks

  ngOnDestroy(): void {
    this._destroy.next(true);
    this._destroy.complete();
  }

  ngOnInit(): void {
    const idx = this._serverIDs.indexOf(this.source);
    if (idx !== -1) {
      const server: Server = AppConfig.SERVERS[idx];
      if (server.hasOwnProperty('familyTreeLink')) {
        this.familyTreeLink = server.familyTreeLink.url + this.family;
      }
    }
    this._geneService.getGeneDetails(this.gene, this.source)
      .pipe(
        takeUntil(this._destroy),
        take(1))
      .subscribe((links) => this._process(links));
  }

  // private

  private _process(links: any[]) {
    this.links = links;
  }
}


export const geneDetailLayoutComponent = 
  {component: GeneDetailComponent, name: 'gene'};


export function geneDetailConfigFactory(gene, family, source) {
  const id = `gene:${gene}:${source}`;
  return {
    type: 'component',
    componentName: 'gene',
    id: id,
    title: `Gene ${gene}`,
    componentState: {inputs: {gene, family, source}}
  };
}
