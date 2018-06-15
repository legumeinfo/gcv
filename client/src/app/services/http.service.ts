// Angular
import { HttpClient, HttpParams } from "@angular/common/http";
import { BehaviorSubject, Observable, throwError } from "rxjs";
import { filter, share } from "rxjs/operators";
// app
import { AppConfig } from "../app.config";
import { GET, POST, Server } from "../models";

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
      return throwError("\"" + serverID + "\" is not a valid server ID");
    }
    if (!source.hasOwnProperty(requestType)) {
      return throwError("\"" + serverID + "\" does not support requests of type \"" + requestType + "\"");
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
    return throwError("\"" + serverID + "\" requests of type \"" + requestType + "\" does not support HTTP GET or POST methods");
  }
}
