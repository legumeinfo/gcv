// Angular
import { Component,
         Input,
         OnChanges,
         SimpleChanges } from '@angular/core';

// App
import { AppConfig }      from '../../app.config';
import { DetailsService } from '../../services/details.service';
import { Gene }           from '../../models/gene.model';
import { Server }         from '../../models/server.model';

@Component({
  moduleId: module.id.toString(),
  selector: 'gene-detail',
  template: `
    <spinner [data]="links"></spinner>
    <h4>{{gene.name}}</h4>
    <p>Family: <a href="{{familyTreeLink}}">{{gene.family}}</a></p>
    <p><a href="#/search/{{gene.source}}/{{gene.name}}">Search for similar contexts</a></p>
    <ul>
      <li *ngFor="let link of links">
        <a href="{{link.href}}">{{link.text}}</a>
      </li>
    </ul>
  `,
  styles: [ '' ]
})

export class GeneDetailComponent implements OnChanges {

  private _serverIDs = AppConfig.SERVERS.map(s => s.id);

  @Input() gene: Gene;

  links: any[];
  familyTreeLink: string;

  constructor(private _detailsService: DetailsService) { }

  ngOnChanges(changes: SimpleChanges): void {
    this.links = undefined;
    if (this.gene !== undefined) {
      this.links = undefined;

      let idx = this._serverIDs.indexOf(this.gene.source);
      this.familyTreeLink = "http://legumeinfo.org/chado_gene_phylotree_v2?family=" + this.gene.family + "&gene_name=" + this.gene.name;
      if (idx != -1) {
        let s: Server = AppConfig.SERVERS[idx];
        if (s.hasOwnProperty('familyTreeLink')) {
         this.familyTreeLink = s.familyTreeLink.url + this.gene.family;
        }
       }

      this._detailsService.getGeneDetails(this.gene, links => {
        this.links = links;
      });
    }
  }
}
