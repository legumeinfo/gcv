// Angular
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { filter, switchMap, take, takeUntil } from 'rxjs/operators';
// App
import { AppConfig } from '@gcv/core/models';
import { RegionService, GeneService } from '@gcv/gene/services';
import { Track } from '@gcv/gene/models';


@Component({
  selector: 'gcv-track-detail',
  styleUrls: ['../details.scss'],
  template: `
    <div class="details">
      <h4>{{ track.genus[0] }}.{{ track.species }} - {{ track.name }}</h4>
      <p><a [routerLink]="['/search', track.source, focus]" queryParamsHandling="merge">Search for similar contexts</a></p>
      <ul>
        <li *ngFor="let link of regionLinks">
          <a href="{{ link.href }}">{{ link.text }}</a>
        </li>
      </ul>
      <p>Genes:</p>
      <ul>
        <li *ngFor="let gene of track.genes; let i = index">
          {{ gene }}
          <ul *ngIf="familyTreeLink !== '' && track.families[i] !== ''">
            <li>
              Family: <a href="{{ familyTreeLink }}{{ track.families[i] }}">{{ track.families[i] }}</a>
            </li>
          </ul>
        </li>
      </ul>
    </div>
  `,
})
export class TrackDetailComponent implements OnDestroy, OnInit {

  @Input() track: Track;

  private _serverIDs: string[];
  private _destroy: Subject<boolean> = new Subject();

  focus: string;
  familyTreeLink: string = '';
  regionLinks: any[] = [];

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

  ngOnInit() {
    const i = Math.floor(this.track.genes.length / 2);
    this.focus = this.track.genes[i];
    const server = this._appConfig.getServer(this.track.source);

    // set the tree link
    if (server !== undefined && server.hasOwnProperty('familyTreeLink')) {
      this.familyTreeLink = server.familyTreeLink.url;
    }

    // get region details
    const first = this.track.genes[0];
    const last = this.track.genes[this.track.genes.length-1];
    this._geneService.getGenes([first, last], this.track.source)
      .pipe(
        filter((genes) => genes.length >= 2),
        switchMap((genes) => {
          const fmin = Math.min(genes[0].fmin, genes[1].fmin);
          const fmax = Math.max(genes[0].fmax, genes[1].fmax);
          return this._regionService
            .getRegionDetails(this.track.name, fmin, fmax, this.track.source);
        }),
        takeUntil(this._destroy),
        take(1))
      .subscribe((links) => this._processRegionLinks(links));
  }

  private _processRegionLinks(links: any[]) {
    this.regionLinks = links;
  }

}
