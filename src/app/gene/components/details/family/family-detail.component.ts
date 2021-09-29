// Angular
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
// App
import { AppConfig, Server } from '@gcv/core/models';
import { Track } from '@gcv/gene/models';
import { MicroTracksService } from '@gcv/gene/services';


@Component({
  selector: 'gcv-family-detail',
  styleUrls: ['../details.scss'],
  template: `
    <div class="details">
      <h4>{{family.name}}</h4>
      <p><a [routerLink]="['/gene', geneMatrix]" queryParamsHandling="merge">View genes in multi-alignment view</a></p>
      <p>Phylograms: <span *ngIf="familyTreeLinks.length === 0">none</span></p>
      <ul *ngIf="familyTreeLinks.length > 0">
        <li *ngFor="let link of familyTreeLinks">
          <a href="{{link.url}}">{{link.text}}</a>
        </li>
      </ul>
      <p>Genes:</p>
      <ul>
        <li *ngFor="let gene of genes">{{ gene }}</li>
      </ul>
    </div>
  `,
})
export class FamilyDetailComponent implements OnDestroy, OnInit {

  @Input() family: {id: string, name: string};

  private _serverIDs: string[];
  private _destroy: Subject<boolean> = new Subject();

  genes: string[] = [];
  geneMatrix = {};
  familyTreeLinks: any[] = [];

  constructor(
    private _appConfig: AppConfig,
    private _microTracksService: MicroTracksService,
  ) {
    this._serverIDs = _appConfig.getServerIDs();
  }

  // Angular hooks

  ngOnDestroy() {
    this._destroy.next(true);
    this._destroy.complete();
  }

  ngOnInit() {
    const tracks = this._microTracksService.getAllTracks();
    tracks.pipe(takeUntil(this._destroy))
      .subscribe((tracks) => this._process(tracks));
  }

  // private

  private _process(tracks) {
    this.geneMatrix = {};
    this.genes = [];
    const {id} = this.family;

    tracks.forEach(({source, families, genes}) => {
      const familyGenes = genes.filter((g, i) => {
          const f = families[i];
          return (f.length > 0 && id.includes(f)) || f === id;
        });
      if (familyGenes.length > 0) {
        if (!(source in this.geneMatrix)) {
          this.geneMatrix[source] = [];
        }
        this.geneMatrix[source].push(...familyGenes);
        this.genes.push(...familyGenes);
      }
    });

    // TODO: this is a source specific feature and should be provided via a
    // service from the config file (see gene links service)
    this.familyTreeLinks = [];
    if (id.split(',').length === 1 && id !== '') {
      const geneString = this.genes.join(',');
      Object.keys(this.geneMatrix).forEach((s) => {
        const server = this._appConfig.getServer(s);
        if (server !== undefined && server.hasOwnProperty('familyTreeLink')) {
          const familyTreeLink = {
            url: server.familyTreeLink.url + id + '&gene_name=' + geneString,
            text: server.name,
          };
          this.familyTreeLinks.push(familyTreeLink);
        }
      });
    }
  }
}
