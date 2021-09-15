// Angular
import { Component, Input, OnInit } from '@angular/core';
// App
import { AppConfig } from '@gcv/app.config';
import { Server } from '@gcv/core/models';
import { Gene, Track } from '@gcv/gene/models';
import { ClusterMixin } from '@gcv/gene/models/mixins';


@Component({
  selector: 'gcv-track-detail',
  styleUrls: ['../details.scss'],
  template: `
    <div class="details">
      <h4>{{ track.genus[0] }}.{{ track.species }} - {{ track.name }}</h4>
      <p><a [routerLink]="['/search', track.source, focus]" queryParamsHandling="merge">Search for similar contexts</a></p>
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
export class TrackDetailComponent implements OnInit {

  @Input() track: Track;

  private _serverIDs = AppConfig.SERVERS.map(s => s.id);

  focus: string;
  familyTreeLink: string = '';

  // Angular hooks

  ngOnInit() {
    const i = Math.floor(this.track.genes.length / 2);
    this.focus = this.track.genes[i];

    const idx = this._serverIDs.indexOf(this.track.source);
    if (idx != -1) {
      const server: Server = AppConfig.SERVERS[idx];
      if (server.hasOwnProperty('familyTreeLink')) {
        this.familyTreeLink = server.familyTreeLink.url;
      }
    }
  }
}
