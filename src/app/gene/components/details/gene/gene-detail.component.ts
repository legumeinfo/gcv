// Angular
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
// App
import { AppConfig } from '@gcv/app.config';
import { Server } from '@gcv/core/models';
import { GeneService } from '@gcv/gene/services';

@Component({
  selector: 'gcv-gene-detail',
  styleUrls: ['../details.scss'],
  template: `
    <div class="details">
      <h4>{{ gene }}</h4>
      <p><a [routerLink]="['/gene', singleGeneMatrix]" queryParamsHandling="merge">Search for similar contexts</a></p>
      <p *ngIf="familyTreeLink !== undefined">Family: <a href="{{ familyTreeLink }}">{{ family }}</a></p>
      <ul>
        <li *ngFor="let link of links">
          <a href="{{ link.href }}">{{ link.text }}</a>
        </li>
      </ul>
    </div>
  `,
})

export class GeneDetailComponent implements OnDestroy, OnInit {

  @Input() gene: string;
  @Input() family: string;
  @Input() source: string

  private _serverIDs = AppConfig.SERVERS.map(s => s.id);
  private _destroy: Subject<boolean> = new Subject();

  links: any[] = [];
  singleGeneMatrix = {};
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
      this.singleGeneMatrix[this.source] = this.gene;
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
