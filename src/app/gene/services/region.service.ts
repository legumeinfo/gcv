// Angular
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
// store
import { Store } from '@ngrx/store';
import * as regionActions from '@gcv/gene/store/actions/region.actions';
import * as fromRoot from '@gcv/store/reducers';
// app
import { AppConfig, ConfigError, GET, POST, GRPC } from '@gcv/core/models';
import { Region } from '@gcv/gene/models';
import { HttpService } from '@gcv/core/services/http.service';
import { grpcRegionToModel } from './shims';
// api
import { ChromosomeRegionGetReply, ChromosomeRegionGetRequest,
  ChromosomeRegionPromiseClient, } from 'legumeinfo-microservices/dist/chromosomeregion_service/v1';


@Injectable()
export class RegionService extends HttpService {

  constructor(private _appConfig: AppConfig,
              private _http: HttpClient,
              private _store: Store<fromRoot.State>) {
    super(_http);
  }

  getRegion(chromosome: string, start: number, stop: number, serverID: string):
  Observable<Region> {
    start = Math.floor(start);
    stop = Math.ceil(stop);
    const request = this._appConfig.getServerRequest(serverID, 'region');
    if (request.type === GET || request.type === POST) {
      const body = {chromosome, start, stop};
      return this._makeHttpRequest<{region: Region}>(request, body)
        .pipe(
          map(({region}) => region),
          catchError((error) => throwError(error)));
    } else if (request.type === GRPC) {
      const client = new ChromosomeRegionPromiseClient(request.url);
      const grpcRequest = new ChromosomeRegionGetRequest();
      grpcRequest.setChromosome(chromosome);
      grpcRequest.setStart(start);
      grpcRequest.setStop(stop);
      const clientRequest = client.get(grpcRequest, {});
      return from(clientRequest).pipe(
        map((result: ChromosomeRegionGetReply) => {
          const region = grpcRegionToModel(result.getRegion(), serverID);
          return region;
        }),
        catchError((error) => throwError(error)),
      );
    }
    const error = new ConfigError('Unsupported request type \'' + request.type + '\'');
    return throwError(error);
  }

  regionSearch(chromosome: string, start: number, stop: number, source: string):
  void {
    this._store.dispatch(new regionActions.Get({chromosome, start, stop, source}));
  }

  // fetches source specific details for the given region
  getRegionDetails(chromosome: string, start: number, end: number, source: string): Observable<any> {
    const request = this._appConfig.getServerRequest(source, 'regionLinks');
    //TODO: make this more configurable via template-based substitution
    const makeUrl = (url: string) => url + chromosome + ':' + start + '-' + end ;
    return this._makeHttpRequest<any>(request, {}, makeUrl);
  }

}
