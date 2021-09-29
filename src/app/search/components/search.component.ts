// Angular
import { OnInit, Component } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
// App
import { AppConfig, Server } from '@gcv/core/models';
import { SearchService } from '@gcv/search/services';


@Component({
  selector: 'gcv-search',
  styleUrls: ['search.component.scss'],
  templateUrl: 'search.component.html',
})
export class SearchComponent implements OnInit {

  model: any;
  sources: Server[];

  query: Observable<string>;
  resultGenes: Observable<{source: string, name: string}[]>;
  resultRegions: Observable<{source: string, gene: string, neighbors: number}[]>;
  private _sourceNameMap: any;

  constructor(private _appConfig: AppConfig,
              private _router: Router,
              private _searchService: SearchService) {
    this.model = {
      neighbors: '',
      sources: _appConfig.servers
                 .filter((s) => s.hasOwnProperty('search'))
                 .map((s) => s.id),
      selectedGenes: {},
    };
    this.sources = _appConfig.servers.filter((s) => s.hasOwnProperty('search'));
    this._sourceNameMap = _appConfig.servers.reduce(
      (accumulator, server) => {
        accumulator[server.id] = server.name;
        return accumulator;
      },
      {}
    );
  }

  ngOnInit() {
    this.query = this._searchService.getSearchQuery();
    this.resultGenes = this._searchService.getSearchResultGenes();
    this.resultRegions = this._searchService.getSearchResultRegions();
  }

  toggleGene(event, gene: string, source: string): void {
    if (event.target.checked){
      if (!this.model.selectedGenes.hasOwnProperty(source)) {
        this.model.selectedGenes[source] = new Set();
      }
      this.model.selectedGenes[source].add(gene);
    } else {
      this.model.selectedGenes[source].delete(gene);
      if (this.model.selectedGenes[source].size == 0) {
        delete this.model.selectedGenes[source];
      }
    }
  }

  viewGenes(): void {
    const reducer = (accumulator, [key, value]) => {
        accumulator[key] = Array.from(value);
        return accumulator;
      };
    const geneMatrix = Object.entries(this.model.selectedGenes).reduce(reducer, {});
    const queryParams = {};
    // TODO: should this use and be validated by the query params form or have
    // its own form?
    if (!isNaN(this.model.neighbors)) {
      const neighbors = parseInt(this.model.neighbors);
      if (neighbors > 0) {
        queryParams['neighbors'] = neighbors;
      }
    }
    this._router.navigate(['/gene', geneMatrix], {queryParams});
  }

  canSubmit(): boolean {
    return Object.keys(this.model.selectedGenes).length > 0;
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
