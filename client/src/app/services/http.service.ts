// Angular
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs/Observable";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { filter, share } from "rxjs/operators";
// app
import { AppConfig } from "../app.config";
import { GET, POST, Server } from "../models/server.model";

export abstract class HttpService {
  requests: Observable<[any, Observable<any>]>;
  private requestsSubject = new BehaviorSubject<[any, Observable<any>]>(undefined);

  constructor(private http: HttpClient) {
    this.requests = this.requestsSubject.asObservable().pipe(
      filter((request) => request !== undefined)
    );
  }

  // encapsulates HTTP request boilerplate
  protected _makeRequest<T>(
    serverID: string,
    requestType: string,
    body: any,
    makeUrl = ((url: string) => url),
  ): Observable<T> {
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
    const url = makeUrl(request.url);
    const params = new HttpParams({fromObject: body});
    if (request.type === GET) {
      const requestObservable = this.http.get<T>(url, {params}).pipe(
        share()
      );
      this.requestsSubject.next([args, requestObservable]);
      return requestObservable;
    } else if (request.type === POST) {
      const requestObservable = this.http.post<T>(url, body).pipe(
        share()
      );
      this.requestsSubject.next([args, requestObservable]);
      return requestObservable;
    }
    return Observable.throw("\"" + serverID + "\" requests of type \"" + requestType + "\" does not support HTTP GET or POST methods");
  }
}
