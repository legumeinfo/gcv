// Angular
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { filter, map, switchMap, take, takeUntil } from 'rxjs/operators';
// App
import { AppConfig } from '@gcv/core/models';
import { GeneService, RegionService } from '@gcv/gene/services';


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

  constructor(
    private _appConfig: AppConfig,
    private _geneService: GeneService,
    private _regionService: RegionService,
  ) {
    this._serverIDs = _appConfig.getServerIDs();
  }

  // Angular hooks

  ngOnDestroy(): void {
    this._destroy.next(true);
    this._destroy.complete();
  }

  ngOnInit(): void {
    const server = this._appConfig.getServer(this.source);

    // set the tree link
    if (server !== undefined) {
      if (server.hasOwnProperty('familyTreeLink')) {
        this.familyTreeLink = server.familyTreeLink.url + this.family;
      }
      this.singleGeneMatrix[this.source] = this.gene;
    }

    // get gene details
    this._geneService.getGeneDetails(this.gene, this.source)
      .pipe(
        takeUntil(this._destroy),
        take(1))
      .subscribe((links) => this._processGeneLinks(links));

    // get gene region details
    this._geneService.getGenes([this.gene], this.source)
      .pipe(
        filter((genes) => genes.length > 0),
        map((genes) => genes[0]),
        switchMap((gene) => {
          return this._regionService
            .getRegionDetails(
              gene.chromosome,
              gene.fmin,
              gene.fmax,
              this.source,
            );
        }),
        takeUntil(this._destroy),
        take(1))
      .subscribe((links) => this._processRegionLinks(links));
  }

  // private

  private _processGeneLinks(links: any[]) {
    this.geneLinks = links;
  }

  private _processRegionLinks(links: any[]) {
    this.regionLinks = links;
  }

}
