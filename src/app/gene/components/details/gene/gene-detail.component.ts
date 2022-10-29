// Angular
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { map, take, takeUntil } from 'rxjs/operators';
// App
import { AppConfig, Server } from '@gcv/core/models';
import { GeneService } from '@gcv/gene/services';
import { Gene } from '@gcv/gene/models';

@Component({
  selector: 'gcv-gene-detail',
  styleUrls: ['../details.scss'],
  template: `
    <div class="details">
      <h4>{{ gene }}</h4>
      <p><a [routerLink]="['/gene', singleGeneMatrix]" queryParamsHandling="merge">Search for similar contexts</a></p>
      <p *ngIf="familyTreeLink !== undefined">Family: <a href="{{ familyTreeLink }}">{{ family }}</a></p>
      <ul>
        <li *ngFor="let link of geneLinks">
          <a href="{{ link.href }}">{{ link.text }}</a>
        </li>
        <li *ngFor="let link of regionLinks">
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

  private _serverIDs: string[];
  private _destroy: Subject<boolean> = new Subject();

  geneLinks: any[] = [];
  regionLinks: any[] = [];
  singleGeneMatrix = {};
  familyTreeLink: string = '';

  constructor(private _appConfig: AppConfig, private _geneService: GeneService) {
    this._serverIDs = _appConfig.getServerIDs();
  }

  // Angular hooks

  ngOnDestroy(): void {
    this._destroy.next(true);
    this._destroy.complete();
  }

  ngOnInit(): void {
    const server = this._appConfig.getServer(this.source);
    //get gene details to convert to region
    this._geneService.getGenes([this.gene], this.source)
      .pipe(map((genes) => genes[0]))
      .subscribe((geneInstance) => this._processInstance(geneInstance));
    if (server !== undefined) {
      if (server.hasOwnProperty('familyTreeLink')) {
        this.familyTreeLink = server.familyTreeLink.url + this.family;
      }
      this.singleGeneMatrix[this.source] = this.gene;
    }
    this._geneService.getGeneDetails(this.gene, this.source)
      .pipe(
        takeUntil(this._destroy),
        take(1))
      .subscribe((geneLinks) => this._process(geneLinks));
  }

  // private

  private _process(links: any[]) {
    this.geneLinks = links;
  }
  private _processRegion(links: any[]) {
    this.regionLinks = links;
  }

  private _processInstance(instance: Gene) {
    this._geneService.getGeneRegionDetails(instance, this.source)
      .pipe(
        takeUntil(this._destroy),
        take(1))
      .subscribe((regionLinks) => this._processRegion(regionLinks));
  }
}
