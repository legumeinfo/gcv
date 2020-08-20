// Angular
import { OnInit, Component } from '@angular/core';
import { Observable } from 'rxjs';
// App
import { AppConfig } from '@gcv/app.config';
import { SearchService } from '@gcv/search/services';


@Component({
  selector: 'gcv-search',
  styles: [''],
  templateUrl: 'search.component.html',
})
export class SearchComponent implements OnInit {

  public query: Observable<string>;
  public resultGenes: Observable<{source: string, name: string}[]>;
  public resultRegions: Observable<{source: string, gene: string, neighbors: number}[]>;
  private _sourceNameMap = AppConfig.SERVERS.reduce(
    (accumulator, server) => {
      accumulator[server.id] = server.name;
      return accumulator;
    },
    {}
  );

  constructor(private _searchService: SearchService) { }

  ngOnInit() {
    this.query = this._searchService.getSearchQuery();
    this.resultGenes = this._searchService.getSearchResultGenes();
    this.resultRegions = this._searchService.getSearchResultRegions();
  }

  getServerName(id: string): string {
    if (id in this._sourceNameMap) {
      return this._sourceNameMap[id];
    }
    return '';
  }

  geneSourceToRouterGeneMatrix(gene: string, source: string):
  {[key: string]: string} {
    const geneMatrix = {};
    geneMatrix[source] = gene;
    return geneMatrix;
  }

}
