// Angular
import { Component } from '@angular/core';
// app
import { Pipeline } from '@gcv/gene/models';
import { ProcessService } from '@gcv/gene/services';


@Component({
  selector: 'gcv-header-center',
  styles: [],
  template: `
    <gcv-pipeline [info]=info [pipeline]=pipeline></gcv-pipeline>
  `,
})
export class HeaderCenterComponent {

  info = `<p>This is the top level <i>pipeline</i> of the Genome Context Viewer.
          It depicts the flow of data from one <i>process</i> to the next when
          it first enters the application.</p>
          <p>
          <b>Query Genes</b> fetches the genes defined in the URL.
          <br>
          <b>Query Tracks</b> makes <i>micro tracks</i> from the regions that
          flank the query genes on their chromosomes.
          <br>
          <b>Clustering</b> groups similar query tracks together.
          <br>
          <b>Alignment</b> multiple aligns the query tracks within a cluster.
          </p>
          <p class="mb-0">Each cluster of aligned micro tracks is displayed
          below in its own micro synteny viewer.</p>`;

  pipeline: Pipeline; 

  constructor(private _processService: ProcessService) {
    this.pipeline = {
        'Query Genes': _processService.getQueryGeneProcess(),
        'Query Tracks': _processService.getQueryTrackProcess(),
        'Clustering': _processService.getClusteringProcess(),
        'Alignment': _processService.getQueryAlignmentProcess(),
      };
  }

}
