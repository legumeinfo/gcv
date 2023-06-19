// Angular
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
// store
import { Store, select } from '@ngrx/store';
import * as geneActions from '@gcv/gene/store/actions/gene.actions';
import * as fromRoot from '@gcv/store/reducers';
import * as fromGene from '@gcv/gene/store/selectors/gene/';
// app
import { AppConfig, GenePlaceholders, ConfigError, GET, POST, GRPC } from '@gcv/core/models';
import { HttpService } from '@gcv/core/services/http.service';
import { Gene, Track } from '@gcv/gene/models';
import { placeholderReplace } from '@gcv/core/utils';
// api
import { GenesGetReply, GenesGetRequest, GenesPromiseClient }
  from 'legumeinfo-microservices/dist/genes_service/v1';


@Injectable()
export class GeneService extends HttpService {

  constructor(private _appConfig: AppConfig,
              private _http: HttpClient,
              private _store: Store<fromRoot.State>) {
    super(_http);
  }

  // fetches genes for the given gene ids from the given source
  getGenes(genes: string[], serverID: string): Observable<Gene[]> {
    // TODO: try/catch?
    const request = this._appConfig.getServerRequest(serverID, 'genes');
    if (request.type === GET || request.type === POST) {
      const body = {genes};
      return this._makeHttpRequest<{genes: Gene[]}>(request, body).pipe(
        map((result) => {
          result.genes.forEach((g) => g.source = serverID);
          return result.genes;
        }),
        catchError((error) => throwError(error)),
      );
    } else if (request.type === GRPC) {
      const client = new GenesPromiseClient(request.url);
      const grpcRequest = new GenesGetRequest();
      grpcRequest.setNamesList(genes);
      const clientRequest = client.get(grpcRequest, {});
      return from(clientRequest).pipe(
        map((result: GenesGetReply) => {
          const genes = result.getGenesList().map((g) => g.toObject() as Gene);
          genes.forEach((g) => g.source = serverID);
          return genes;
        }),
        catchError((error) => throwError(error)),
      );
    }
    const error = new ConfigError('Unsupported request type \'' + request.type + '\'');
    return throwError(error);
  }

  getGenesForSource(names: string[], source: string): Observable<Gene[]> {
    const action = new geneActions.Get({names, source});
    this._store.dispatch(action);
    return this._store.pipe(select(fromGene.getGenesForSource(names, source)));
  }

  getGenesForTracks(tracks: Track[]): Observable<Gene[]> {
    const actions = geneActions.tracksToGetGeneActions(tracks);
    actions.forEach((a) => this._store.dispatch(a));
    return this._store.pipe(select(fromGene.getGenesForTracks(tracks)));
  }

  // returns all the genes from the URL
  getQueryGenes(): Observable<Gene[]> {
    return this._store.select(fromGene.getSelectedGenes);
  }

  //fill in templated geneLinksURL
  //TODO: should different servers be able to specify their own geneLinks?
  export function geneToGeneLinksURL(gene) {
    let name = AppConfig.geneLinks.url;
    const placeholders = {};
    placeholders[GenePlaceholders.GeneID] = gene;
    return placeholderReplace(name, placeholders);
  };

  // fetches source specific details for the given gene
  getGeneDetails(gene: string, source: string): Observable<any> {
    const request = this._appConfig.getServerRequest(source, 'geneLinks');
    //TODO: make this more configurable via template substitution
    const makeUrl = (url: string) => geneToGeneLinksURL(gene);
    return this._makeHttpRequest<any>(request, {}, makeUrl);
  }

}
