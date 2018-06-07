// Angular
import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
// App
import { AppConfig } from "../../app.config";
import { DetailsService } from "../../services";
import { Family, Gene, MicroTracks, Server } from "../../models";

@Component({
  selector: "family-detail",
  styles: [ "" ],
  template: `
    <h4>{{family.name}}</h4>
    <p><a [routerLink]="['/multi', geneList]" queryParamsHandling="merge">View genes in multi-alignment view</a></p>
    <p>Phylograms: <span *ngIf="familyTreeLinks.length === 0">none</span></p>
    <ul *ngIf="familyTreeLinks.length > 0">
      <li *ngFor="let link of familyTreeLinks">
        <a href="{{link.url}}">{{link.text}}</a>
      </li>
    </ul>
    <p>Genes:</p>
    <ul>
      <li *ngFor="let gene of genes">
        {{gene.name}}: {{gene.fmin}} - {{gene.fmax}}
      </li>
    </ul>
  `,
})
export class FamilyDetailComponent implements OnChanges {

  private _serverIDs = AppConfig.SERVERS.map(s => s.id);

  @Input() family: Family;
  @Input() tracks: MicroTracks;

  genes: Gene[];
  geneList: string;
  familyTreeLinks: any[];

  constructor(private detailsService: DetailsService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.family !== undefined && this.tracks !== undefined) {
      this.genes = this.tracks.groups.reduce((l, group) => {
        const genes = group.genes.filter((g) => {
          return (g.family.length > 0 && this.family.id.includes(g.family)) ||
            g.family === this.family.id;
        });
        l.push.apply(l, genes);
        return l;
      }, []);
      const linkablePhylo = this.family.id !== "" && new Set(this.genes.map((g) => {
        return g.family;
      })).size === 1;
      this.geneList = this.genes.map((x) => x.name).join(",");
      this.familyTreeLinks = [];

      if (linkablePhylo) {
        const sources = new Set(this.genes.map((g) => g.source));
        sources.forEach((source) => {
          const idx = this._serverIDs.indexOf(source);
          if (idx !== -1) {
            const s: Server = AppConfig.SERVERS[idx];
            if (s.hasOwnProperty("familyTreeLink")) {
              const familyTreeLink = {
                url: s.familyTreeLink.url + this.family.name + "&gene_name=" + this.geneList,
                text: s.name,
              };
              this.familyTreeLinks.push(familyTreeLink);
            }
          }
        });
      }
    }
  }
}
