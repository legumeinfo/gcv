// Angular
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
// App
import { AppConfig } from '@gcv/app.config';
import { Server } from '@gcv/core/models';
import { Track } from '@gcv/gene/models';
import { MicroTracksService } from '@gcv/gene/services';


@Component({
  selector: 'family-detail',
  styles: [ '' ],
  template: `
    <h4>{{family.name}}</h4>
    <p><a [routerLink]="['/multi', geneString]" queryParamsHandling="merge">View genes in multi-alignment view</a></p>
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
  `,
})
export class FamilyDetailComponent implements OnDestroy, OnInit {

  @Input() family: string;

  private _serverIDs = AppConfig.SERVERS.map(s => s.id);
  private _destroy: Subject<boolean> = new Subject();

  genes: string[] = [];
  geneString: string = '';
  familyTreeLinks: any[] = [];

  constructor(private _microTracksService: MicroTracksService) { }

  // Angular hooks

  ngOnDestroy() {
    this._destroy.next(true);
    this._destroy.complete();
  }

  ngOnInit() {
    const tracks = this._microTracksService.getAllTracks();
    tracks
      .pipe(takeUntil(this._destroy), take(1))
      .subscribe((tracks) => this._process(tracks));
  }

  // private

  private _process(tracks) {
    this.genes = [];
    const families = new Set<string>();
    const sources = new Set<string>();
    tracks.forEach((t) => {
      sources.add(t.source);
      t.families.forEach((f, i) => {
        if ((f.length > 0 && this.family.includes(f)) || f === this.family) {
          this.genes.push(t.genes[i]);
          families.add(f);
        }
      });
    });
    this.geneString = this.genes.join(',');

    this.familyTreeLinks = [];
    if (families.size === 1) {
      sources.forEach((s) => {
        const idx = this._serverIDs.indexOf(s);
        if (idx !== -1) {
          const server: Server = AppConfig.SERVERS[idx];
          if (server.hasOwnProperty('familyTreeLink')) {
            const familyTreeLink = {
              url: server.familyTreeLink.url + this.family + '&gene_name=' + this.geneString,
              text: server.name,
            };
            this.familyTreeLinks.push(familyTreeLink);
          }
        }
      });
    }
  }
}


export const familyDetailLayoutComponent =
  {component: FamilyDetailComponent, name: 'family'};


export function familyDetailConfigFactory(family: string) {
  const id = `family:${family}`;
  let title = family;
  if (title == '') {
    title = 'Orphans';
  } else if (title.split(',').length > 1) {
    title = 'Singletons';
  }
  return {
    type: 'component',
    componentName: 'family',
    id: id,
    title: `Family: ${title}`,
    componentState: {inputs: {family}}
  };
}
