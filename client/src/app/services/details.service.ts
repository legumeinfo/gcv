// Angular
import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
// app
import { AppConfig } from "../app.config";
import { Gene } from "../models/gene.model";
import { GET, POST, Server } from "../models/server.model";

@Injectable()
export class DetailsService {
  requests: Observable<[any, Observable<any>]>;
  private requestsSubject = new Subject<[any, Observable<any>]>();

  private serverIDs = AppConfig.SERVERS.map((s) => s.id);

  constructor(private http: HttpClient) {
    this.requests = this.requestsSubject.asObservable();
  }

  getGeneDetails(gene: Gene, success: (e) => void): void {
    this._makeRequest<any>(gene, gene.source, "geneLinks", {})
      .subscribe(
        success,
        (error) => {
          console.log(error);
        }
      );
  }

  // encapsulates HTTP request boilerplate
  private _makeRequest<T>(gene: Gene, serverID: string, requestType: string, body: any): Observable<T> {
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
    const url = request.url + gene.name + "/json";
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
}
