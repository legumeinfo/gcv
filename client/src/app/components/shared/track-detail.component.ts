// Angular
import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
// App
import { AppConfig } from "../../app.config";
import { Gene, Group, Server } from "../../models";

@Component({
  selector: "track-detail",
  styles: [ "" ],
  template: `
    <h4>{{track.genus[0]}}.{{track.species}} - {{track.chromosome_name}}</h4>
    <p><a [routerLink]="['/search', track.source, focus]" queryParamsHandling="merge">Search for similar contexts</a></p>
    <p>Genes:</p>
    <ul>
      <li *ngFor="let gene of track.genes">
        {{gene.name}}: {{gene.fmin}} - {{gene.fmax}}
        <ul *ngIf="familyTreeLink !== undefined && gene.family != ''">
          <li>
            Family: <a href="{{familyTreeLink}}{{gene.family}}">{{gene.family}}</a>
          </li>
        </ul>
      </li>
    </ul>
  `,
})
export class TrackDetailComponent implements OnChanges {

  private _serverIDs = AppConfig.SERVERS.map(s => s.id);

  @Input() track: Group;

  focus: string;
  familyTreeLink: string;

  ngOnChanges(changes: SimpleChanges): void {
    if (this.track !== undefined) {
      const idx = Math.floor(this.track.genes.length / 2);
      this.focus = this.track.genes[idx].name;
    }

    this.familyTreeLink = undefined;
    const idx = this._serverIDs.indexOf(this.track.genes[0].source);
    if (idx != -1) {
      const s: Server = AppConfig.SERVERS[idx];
      if (s.hasOwnProperty("familyTreeLink")) {
        this.familyTreeLink = s.familyTreeLink.url;
      }
    }
  }
}
