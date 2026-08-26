// Angular
import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
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
      <p>
        <a
          [routerLink]="['/search', track.source, focus]"
          queryParamsHandling="merge"
          >Search for similar contexts</a
        >
      </p>
      <ul>
        @for (link of regionLinks; track link) {
          <li>
            <a href="{{ link.href }}">{{ link.text }}</a>
          </li>
        }
      </ul>
      <p>Genes:</p>
      <ul>
        @for (gene of track.genes; track gene; let i = $index) {
          <li>
            {{ gene }}
            @if (familyTreeLink !== '' && track.families[i] !== '') {
              <ul>
                <li>
                  Family:
                  <a href="{{ familyTreeLink }}{{ track.families[i] }}">{{
                    track.families[i]
                  }}</a>
                </li>
              </ul>
            }
          </li>
        }
      </ul>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class TrackDetailComponent implements OnDestroy, OnInit {
  private _appConfig = inject(AppConfig);
  private _geneService = inject(GeneService);
  private _regionService = inject(RegionService);

  @Input() track: Track;

  private _serverIDs: string[];
  private _destroy: Subject<boolean> = new Subject();

  focus: string;
  familyTreeLink: string = '';
  regionLinks: any[] = [];

  constructor() {
    const _appConfig = this._appConfig;

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
    if (
      server !== undefined &&
      Object.prototype.hasOwnProperty.call(server, 'familyTreeLink')
    ) {
      this.familyTreeLink = server.familyTreeLink.url;
    }

    // get region details
    const first = this.track.genes[0];
    const last = this.track.genes[this.track.genes.length - 1];
    this._geneService
      .getGenes([first, last], this.track.source)
      .pipe(
        filter((genes) => genes.length >= 2),
        switchMap((genes) => {
          const fmin = Math.min(genes[0].fmin, genes[1].fmin);
          const fmax = Math.max(genes[0].fmax, genes[1].fmax);
          return this._regionService.getRegionDetails(
            this.track.name,
            fmin,
            fmax,
            this.track.source,
          );
        }),
        takeUntil(this._destroy),
        take(1),
      )
      .subscribe((links) => this._processRegionLinks(links));
  }

  private _processRegionLinks(links: any[]) {
    this.regionLinks = links;
  }
}
