// Angular
import { Component,
         Input, 
         OnChanges,
         SimpleChanges } from '@angular/core';

// App
import { Group }          from '../../models/group.model';

@Component({
  moduleId: module.id,
  selector: 'track-detail',
  template: `
    <h4>{{track.species_name}} - {{track.chromosome_name}}</h4>
    <p><a href="#/search/{{track.source}}/{{focus}}">Search for similar contexts</a></p>
    <p>Genes:</p>
    <ul>
      <li *ngFor="let gene of track.genes">
        {{gene.name}}: {{gene.fmin}} - {{gene.fmax}}
        <ul *ngIf="gene.family != ''">
          <li>
            Family: <a href="http://legumeinfo.org/chado_gene_phylotree_v2?family={{gene.family}}&gene_name={{gene.name}}">{{gene.family}}</a>
          </li>
        </ul>
      </li>
    </ul>
  `,
  styles: [ '' ]
})

export class TrackDetailComponent implements OnChanges {
  @Input() track: Group;

  focus: string;

  ngOnChanges(changes: SimpleChanges): void {
    if (this.track !== undefined) {
      let idx = Math.floor(this.track.genes.length / 2);
      this.focus = this.track.genes[idx].name;
    }
  }
}
