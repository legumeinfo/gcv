// Angular
import { Component,
         Input, 
         OnChanges,
         SimpleChanges } from '@angular/core';

// App
import { DetailsService } from '../../services/details.service';
import { Family }         from '../../models/family.model';
import { Gene }           from '../../models/gene.model';
import { MicroTracks }    from '../../models/micro-tracks.model';

@Component({
  moduleId: module.id,
  selector: 'family-detail',
  template: `
    <h4>{{family.name}}</h4>
    <p><a href="http://legumeinfo.org/chado_gene_phylotree_v2?family={{family.name}}&gene_name={{gene_list}}">View genes in phylogram</a></p>
    <p>Genes:</p>
    <ul>
      <li *ngFor="let gene of genes">
        {{gene.name}}: {{gene.fmin}} - {{gene.fmax}}
      </li>
    </ul>
  `,
  styles: [ '' ]
})

export class FamilyDetailComponent implements OnChanges {
  @Input() family: Family;
  @Input() tracks: MicroTracks;

  genes: Gene[];
  gene_list: string;

  constructor(private _detailsService: DetailsService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.family !== undefined) {
      this.genes = this.tracks.groups.reduce((l, group) => {
        let genes = group.genes.filter(g => g.family == this.family.name);
        l.push.apply(l, genes);
        return l;
      }, []);
      this.gene_list = this.genes.map(x => x.name).join(',');
    }
  }
}
