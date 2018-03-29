// Angular
import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
// store
import { Observable } from "rxjs/Observable";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { _throw } from "rxjs/observable/throw";
import { catchError, map } from "rxjs/operators";
import { Store } from "@ngrx/store";
import * as globalPlotsActions from "../actions/global-plots.actions";
import * as localPlotsActions from "../actions/local-plots.actions";
import * as fromRoot from "../reducers";
import * as fromGlobalPlots from "../reducers/global-plots.store";
import * as fromLocalPlots from "../reducers/local-plots.store";
// app
import { AppConfig } from "../app.config";
import { AppRoutes } from "../constants/app-routes";
import { Gene } from "../models/gene.model";
import { Group } from "../models/group.model";
import { MicroTracks } from "../models/micro-tracks.model";
import { GET, POST, Server } from "../models/server.model";

@Injectable()
export class PlotsService {
  // TODO: make this more reactive
  localPlots: Observable<Group[]>;
  selectedLocalPlot: Observable<Group>
  selectedGlobalPlot: Observable<Group>;
  selectedLocalPlotID: Observable<string>;
  selectedGlobalPlotID: Observable<string>;

  requests: Observable<[any, Observable<any>]>;
  private requestsSubject = new BehaviorSubject<[any, Observable<any>]>(undefined);

  private serverIDs = AppConfig.SERVERS.map((s) => s.id);

  constructor(private http: HttpClient, private store: Store<fromRoot.State>) {
    this.requests = this.requestsSubject.asObservable()
      .filter((request) => request !== undefined);
    // initialize observables
    this.localPlots = store.select(fromLocalPlots.getAllPlots);
    this.selectedLocalPlotID = store.select(fromLocalPlots.getSelectedPlotID);
    this.selectedGlobalPlotID = store.select(fromGlobalPlots.getSelectedPlotID);
    this.selectedLocalPlot = store.select(fromLocalPlots.getSelectedPlot);
    this.selectedGlobalPlot = store.select(fromGlobalPlots.getSelectedPlot);
  }

  getPlot(reference: Group, track: Group): Observable<Group> {
    const familyCoordinates = this._genesToFamilyCoordinates(reference.genes);
    return Observable.create((observer) => {
      const plot = this._getPlot(familyCoordinates, track);
      observer.next(plot);
      observer.complete();
    });
  }

  getPlots(reference: Group, tracks: Group[]): Observable<Group[]> {
    const familyCoordinates = this._genesToFamilyCoordinates(reference.genes);
    return Observable.create((observer) => {
      const plots = tracks.map((track) => this._getPlot(familyCoordinates, track));
      observer.next(plots);
      observer.complete();
    });
  }

  selectLocal(id: string): void {
    this.store.dispatch(new localPlotsActions.Select({id}));
  }

  selectGlobal(id: string): void {
    this.store.dispatch(new globalPlotsActions.GetOrSelect({id}));
  }

  getGlobalFromLocal(reference: Group, local: Group): Observable<Group> {
    const body = {
      chromosome: local.chromosome_name,
      query: reference.genes.map((g) => g.family),
    };
    return this._makeRequest<Gene[]>(local.source, "plotGlobal", body).pipe(
      map((genes) => {
        const familyCoordinates = this._genesToFamilyCoordinates(reference.genes);
        genes.forEach((gene) => gene.source = local.source);
        return {
          ...local,
          genes: this._getPlotPoints(familyCoordinates, genes),
        };
      }),
      catchError((error) => _throw(error)),
    );
  }

  // encapsulates HTTP request boilerplate
  private _makeRequest<T>(serverID: string, requestType: string, body: any): Observable<T> {
    const args = {serverID, requestType, body};
    let source: Server;
    const i = AppConfig.SERVERS.map((s) => s.id).indexOf(serverID);
    if (i > -1) {
      source = AppConfig.SERVERS[i];
    } else {
      return Observable.throw("\"" + serverID + "\" is not a valid server ID");
    }
    if (!source.hasOwnProperty(requestType)) {
      return Observable.throw("\"" + serverID + "\" does not support requests of type \"" + requestType + "\"");
    }
    const request = source[requestType];
    const params = new HttpParams({fromObject: body});
    if (request.type === GET) {
      const requestObservable = this.http.get<T>(request.url, {params});
      this.requestsSubject.next([args, requestObservable]);
      return requestObservable;
    } else if (request.type === POST) {
      const requestObservable = this.http.post<T>(request.url, body);
      this.requestsSubject.next([args, requestObservable]);
      return requestObservable;
    }
    return Observable.throw("\"" + serverID + "\" requests of type \"" + requestType + "\" does not support HTTP GET or POST methods");
  }

  private _getPlot(familyCoordinates: any, track: Group): Group {
    return {
      ...track,
      genes: this._getPlotPoints(familyCoordinates, track.genes),
    };
  }

  private _getPlotPoints(familyCoordinates: any, genes: Gene[]): Gene[] {
    return genes.reduce((points, gene) => {
      const family = gene.family;
      const x = (gene.fmin + gene.fmax) / 2;
      if (family in familyCoordinates) {
        for (const y of familyCoordinates[family]) {
          const point = Object.create(gene);
          point.x = x;
          point.y = y;
          points.push(point);
        }
      } else {
        const point = Object.create(gene);
        point.x = x;
        point.y = null;
        points.push(point);
      }
      return points;
    }, []);
  }

  private _genesToFamilyCoordinates(genes: Gene[]): any {
    return genes.reduce((familyCoordinates, gene) => {
      const family = gene.family;
      if (family !== "") {
        if (!(family in familyCoordinates)) {
          familyCoordinates[family] = [];
        }
        const coordinate = (gene.fmin + gene.fmax) / 2;
        familyCoordinates[family].push(coordinate);
      }
      return familyCoordinates;
    }, {});
  }
}
