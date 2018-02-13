// Angular
import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";

// App
import { Gene } from "../../models/gene.model";
import { DetailsService } from "../../services/details.service";

@Component({
  moduleId: module.id.toString(),
  selector: "gene-detail",
  styles: [ "" ],
  template: `
    <spinner [data]="links"></spinner>
    <h4>{{gene.name}}</h4>
    <p>Family: <a href="http://legumeinfo.org/chado_gene_phylotree_v2?family={{gene.family}}&gene_name={{gene.name}}">{{gene.family}}</a></p>
    <p><a href="#/search/{{gene.source}}/{{gene.name}}">Search for similar contexts</a></p>
    <ul>
      <li *ngFor="let link of links">
        <a href="{{link.href}}">{{link.text}}</a>
      </li>
    </ul>
  `,
})
export class GeneDetailComponent implements OnChanges {
  @Input() gene: Gene;

  links: any[];

  constructor(private detailsService: DetailsService) { }

  ngOnChanges(changes: SimpleChanges): void {
    this.links = undefined;
    if (this.gene !== undefined) {
      this.links = undefined;
      this.detailsService.getGeneDetails(this.gene, (links) => {
        this.links = links;
      });
    }
  }
}
