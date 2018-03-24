// Angular
import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";

// App
import { AppConfig } from "../app.config";
import { Gene } from "../models/gene.model";
import { GET, POST, Server } from "../models/server.model";

@Injectable()
export class DetailsService {
  private serverIDs = AppConfig.SERVERS.map((s) => s.id);

  constructor(private http: HttpClient) { }

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
      return this.http.get<T>(url, {params});
    } else if (request.type === POST) {
      return this.http.post<T>(url, body);
    }
    return Observable.throw("\"" + serverID + "\" requests of type \"" + requestType + "\" does not support HTTP GET or POST methods");
  }
}
