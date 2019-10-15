// Angular
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
// store
import { Store, select } from '@ngrx/store';
import * as fromRoot from '@gcv/gene/store/reducers';
import * as fromGene from '@gcv/gene/store/selectors/gene/';
// app
import { Gene } from '@gcv/gene/models';
import { HttpService } from '@gcv/core/services/http.service';

@Injectable()
export class GeneService extends HttpService {

  constructor(private _http: HttpClient, private _store: Store<fromRoot.State>) {
    super(_http);
  }

  // fetches genes for the given gene ids from the given source
  getGenes(genes: string[], serverID: string): Observable<Gene[]> {
    const body = {genes};
    return this._makeRequest<{genes: Gene[]}>(serverID, 'genes', body).pipe(
      map((result) => {
        result.genes.forEach((g) => g.source = serverID);
        return result.genes;
      }),
      catchError((error) => throwError(error)),
    );
  }

  // returns all the genes belonging to the given cluster
  getClusterGenes(id: number): Observable<Gene[]> {
    return this._store.pipe(
      select(fromGene.getAlignedMicroTrackClusterGenes(id))
    );
  }

  // fetches source specific details for the given gene
  getGeneDetails(gene: string, source: string): Observable<any> {
    const makeUrl = (url: string) => url + gene + '/json';
    return this._makeRequest<any>(source, 'geneLinks', {}, makeUrl);
  }
}
