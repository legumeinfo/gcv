// Angular
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
// store
import { Store, select } from '@ngrx/store';
import * as fromRoot from '@gcv/store/reducers';
import * as fromChromosome from '@gcv/gene/store/selectors/chromosome/';
// app
import { AppConfig, ConfigError } from '@gcv/app.config';
import { GET, POST, GRPC } from '@gcv/core/models';
import { HttpService } from '@gcv/core/services/http.service';
import { Track } from '@gcv/gene/models';
import { grpcTrackToModel } from './shims';
// api
import { ChromosomeGetReply, ChromosomeGetRequest, ChromosomePromiseClient }
  from 'legumeinfo-microservices/dist/chromosome_service/v1';


@Injectable()
export class ChromosomeService extends HttpService {

  constructor(private _http: HttpClient,
              private _store: Store<fromRoot.State>) {
    super(_http);
  }

  // fetches chromosome for the given chromosome id from the given source
  getChromosome(name: string, serverID: string):
  Observable<Track> {
    const request = AppConfig.getServerRequest(serverID, 'chromosome');
    if (request.type === GET || request.type === POST) {
      const body = {chromosome: name};
      return this._makeHttpRequest<{chromosome: Track}>
      (request, body).pipe(
        map((result) => {
          const c = result.chromosome;
          c.name = name;
          c.source = serverID;
          return c;
        }),
        catchError((error) => throwError(error)),
      );
    } else if (request.type === GRPC) {
      const client = new ChromosomePromiseClient(request.url);
      const grpcRequest = new ChromosomeGetRequest();
      grpcRequest.setName(name);
      const clientRequest = client.get(grpcRequest, {});
      return from(clientRequest).pipe(
        map((result: ChromosomeGetReply) => {
          const grpcChromosome = result.getChromosome();
          const chromosome =
            grpcTrackToModel(grpcChromosome.getTrack(), name, serverID);
          chromosome.length = grpcChromosome.getLength();
          return chromosome;
        }),
        catchError((error) => throwError(error)),
      );
    }
    const error = new ConfigError('Unsupported request type \'' + request.type + '\'');
    return throwError(error);
  }

  getSelectedChromosomes(): Observable<Track[]> {
    return this._store.select(fromChromosome.getSelectedChromosomes);
  }

  getSelectedChromosomesForCluster(clusterID: number): Observable<Track[]> {
    return this._store.pipe(
      select(fromChromosome.getSelectedChromosomesForCluster(clusterID))
    );
  }
}
