// Angular
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { map, take, takeUntil } from 'rxjs/operators';
// App
import { AppConfig, Server } from '@gcv/core/models';
import { RegionService, GeneService } from '@gcv/gene/services';
import { Gene, Track } from '@gcv/gene/models';
import { ClusterMixin } from '@gcv/gene/models/mixins';


@Component({
  selector: 'gcv-track-detail',
  styleUrls: ['../details.scss'],
  template: `
    <div class="details">
      <h4>{{ track.genus[0] }}.{{ track.species }} - {{ track.name }}</h4>
      <p><a [routerLink]="['/search', track.source, focus]" queryParamsHandling="merge">Search for similar contexts</a></p>
      <li *ngFor="let link of regionLinks">
        <a href="{{ link.href }}">{{ link.text }}</a>
      </li>
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
  fmin: number;
  fmax: number;

  constructor(private _appConfig: AppConfig, private _regionService: RegionService, private _geneService: GeneService) {
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
    if (server !== undefined && server.hasOwnProperty('familyTreeLink')) {
      this.familyTreeLink = server.familyTreeLink.url;
    }
    const first = this.track.genes[0];
    const last = this.track.genes[this.track.genes.length-1];
    this._geneService.getGenes([first, last], this.track.source)
      .pipe(
        takeUntil(this._destroy),
        take(1))
      .subscribe(([firstGene, lastGene]) => this._setBounds(firstGene,lastGene));
  }

  private _process(links: any[]) {
    this.regionLinks = links;
  }

  private _setBounds(first: Gene, last: Gene) {
    if (first.fmin < last.fmin) {
        this.fmin = first.fmin;
        this.fmax = last.fmax;
    }
    else {
        this.fmin = last.fmin;
        this.fmax = first.fmax;
    }
    this._regionService.getRegionDetails(this.track.name, this.fmin, this.fmax, this.track.source)
      .pipe(
        takeUntil(this._destroy),
        take(1))
      .subscribe((regionLinks) => this._process(regionLinks));
  }

}
