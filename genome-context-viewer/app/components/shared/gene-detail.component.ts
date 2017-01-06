// Angular
import { Component,
         Input, 
         OnChanges,
         SimpleChanges } from '@angular/core';

// App
import { DetailsService } from '../../services/details.service';
import { Gene }           from '../../models/gene.model';

@Component({
  moduleId: module.id,
  selector: 'gene-detail',
  template: `
    <spinner [data]="links"></spinner>
    <h4>{{gene.name}}</h4>
    <p>Family: <a href="/chado_gene_phylotree_v2/{{gene.family}}?gene_name={{gene.name}}">{{gene.family}}</a></p>
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
  @Input() gene: Gene;

  links: any[];

  constructor(private _detailsService: DetailsService) { }

  ngOnChanges(changes: SimpleChanges): void {
    this.links = undefined;
    if (this.gene !== undefined) {
      this.links = undefined;
      this._detailsService.getGeneDetails(this.gene, links => {
        this.links = links;
      });
    }
  }
}
