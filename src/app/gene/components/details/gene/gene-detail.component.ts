// Angular
import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { Observable, Subject, firstValueFrom } from 'rxjs';
import { filter, map, switchMap, take, takeUntil } from 'rxjs/operators';
// App
import { AppConfig } from '@gcv/core/models';
import { GeneService, ParamsService, RegionService } from '@gcv/gene/services';

@Component({
  selector: 'gcv-gene-detail',
  styleUrls: ['../details.scss'],
  template: `
    <div class="details">
      <h4>{{ gene }}</h4>
      <p>
        <button
          type="button"
          class="btn btn-sm btn-outline-dark"
          [attr.aria-pressed]="pinned | async"
          (click)="togglePin()"
        >
          {{ (pinned | async) ? 'Unpin' : 'Pin' }}
        </button>
      </p>
      <p>
        <a
          [routerLink]="['/gene', singleGeneMatrix]"
          queryParamsHandling="merge"
          >Search for similar contexts</a
        >
      </p>
      @if (familyTreeLink !== undefined) {
        <p>
          Family: <a href="{{ familyTreeLink }}">{{ family }}</a>
        </p>
      }
      <ul>
        @for (link of geneLinks; track link) {
          <li>
            <a href="{{ link.href }}">{{ link.text }}</a>
          </li>
        }
        @for (link of regionLinks; track link) {
          <li>
            <a href="{{ link.href }}">{{ link.text }}</a>
          </li>
        }
      </ul>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class GeneDetailComponent implements OnDestroy, OnInit {
  private _appConfig = inject(AppConfig);
  private _geneService = inject(GeneService);
  private _paramsService = inject(ParamsService);
  private _regionService = inject(RegionService);

  @Input() gene: string;
  @Input() family: string;
  @Input() source: string;

  private _serverIDs: string[];
  private _destroy: Subject<boolean> = new Subject();

  geneLinks: any[] = [];
  regionLinks: any[] = [];
  singleGeneMatrix = {};
  familyTreeLink: string = '';
  pinned: Observable<boolean>;

  constructor() {
    const _appConfig = this._appConfig;

    this._serverIDs = _appConfig.getServerIDs();
  }

  // Angular hooks

  ngOnDestroy(): void {
    this._destroy.next(true);
    this._destroy.complete();
  }

  ngOnInit(): void {
    this.pinned = this._paramsService
      .getPinParams()
      .pipe(map(({ pingene }) => pingene.includes(this.gene)));

    const server = this._appConfig.getServer(this.source);

    // set the tree link
    if (server !== undefined) {
      if (Object.prototype.hasOwnProperty.call(server, 'familyTreeLink')) {
        this.familyTreeLink = server.familyTreeLink.url + this.family;
      }
      this.singleGeneMatrix[this.source] = this.gene;
    }

    // get gene details
    this._geneService
      .getGeneDetails(this.gene, this.source)
      .pipe(takeUntil(this._destroy), take(1))
      .subscribe((links) => this._processGeneLinks(links));

    // get gene region details
    this._geneService
      .getGenes([this.gene], this.source)
      .pipe(
        filter((genes) => genes.length > 0),
        map((genes) => genes[0]),
        switchMap((gene) => {
          return this._regionService.getRegionDetails(
            gene.chromosome,
            gene.fmin,
            gene.fmax,
            this.source,
          );
        }),
        takeUntil(this._destroy),
        take(1),
      )
      .subscribe((links) => this._processRegionLinks(links));
  }

  // public

  async togglePin(): Promise<void> {
    const pinned = await firstValueFrom(this.pinned);
    await this._paramsService.updatePins(pinned ? 'remove' : 'add', {
      genes: [this.gene],
    });
  }

  // private

  private _processGeneLinks(links: any[]) {
    this.geneLinks = links;
  }

  private _processRegionLinks(links: any[]) {
    this.regionLinks = links;
  }
}
