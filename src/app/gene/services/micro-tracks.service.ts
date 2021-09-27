// Angular
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, combineLatest, from, throwError } from 'rxjs';
import { catchError, map, take } from 'rxjs/operators';
// store
import { Store, select } from '@ngrx/store';
import * as routerActions from '@gcv/store/actions/router.actions';
import * as fromRoot from '@gcv/store/reducers';
import * as fromMicroTracks from '@gcv/gene/store/selectors/micro-tracks/';
// app
import { AppConfig, ConfigError } from '@gcv/app.config';
import { Track } from '@gcv/gene/models';
import { QueryParams } from '@gcv/gene/models/params';
import { AlignmentMixin, ClusterMixin } from '@gcv/gene/models/mixins';
import { GET, POST, GRPC } from '@gcv/core/models';
import { HttpService } from '@gcv/core/services/http.service';
import { grpcTrackToModel } from './shims';
// api
import { MicroSyntenySearchReply, MicroSyntenySearchRequest,
  MicroSyntenySearchPromiseClient } from 'legumeinfo-microservices/dist/microsyntenysearch_service/v1';


@Injectable()
export class MicroTracksService extends HttpService {

  constructor(private _http: HttpClient, private _store: Store<fromRoot.State>) {
    super(_http);
  }

  microTracksSearch(families: string[], params: QueryParams, serverID: string):
  Observable<Track[]> {
    const request = AppConfig.getServerRequest(serverID, 'microSearch');
    if (request.type === GET || request.type === POST) {
      const body = {
        intermediate: String(params.intermediate),
        matched: String(params.matched),
        query: families,
      };
      return this._makeHttpRequest<{tracks: Track[]}>(request, body)
        .pipe(
          map(({tracks}) => tracks),
          catchError((error) => throwError(error)));
    } else if (request.type === GRPC) {
      const client = new MicroSyntenySearchPromiseClient(request.url);
      const grpcRequest = new MicroSyntenySearchRequest();
      grpcRequest.setQueryList(families);
      grpcRequest.setMatched(params.matched);
      grpcRequest.setIntermediate(params.intermediate);
      const clientRequest = client.search(grpcRequest, {});
      return from(clientRequest).pipe(
        map((result: MicroSyntenySearchReply) => {
          const tracks = result.getTracksList()
            .map((t) => grpcTrackToModel(t.getTrack(), t.getName(), serverID));
          return tracks;
        }),
        catchError((error) => throwError(error)),
      );
    }
    const error = new ConfigError('Unsupported request type \'' + request.type + '\'');
    return throwError(error);
  }

  getSelectedTracks(): Observable<Track[]> {
    return this._store.select(fromMicroTracks.getSelectedMicroTracks);
  }

  getClusterIDs(): Observable<number[]> {
    return this._store.select(fromMicroTracks.getClusterIDs);
  }

  // returns all the aligned micro-tracks (selected and search result) belonging
  // to the given cluster
  getCluster(id: number): Observable<(Track & ClusterMixin & AlignmentMixin)[]>
  {
    return this._store.pipe(
      select(fromMicroTracks.getAlignedMicroTrackCluster(id))
    );
  }

  getSelectedClusterTracks(id: number):
  Observable<(Track & ClusterMixin & AlignmentMixin)[]> {
    return this._store.pipe(
      select(fromMicroTracks.getSelectedMicroTracksForCluster(id))
    );
  }

  getAllTracks(): Observable<(Track & ClusterMixin & AlignmentMixin)[]> {
    return this._store.select(
      fromMicroTracks.getAllClusteredAndAlignedMicroTracks
    );
  }
}
