// Angular
import { Injectable } from "@angular/core";
import { Http, Response } from "@angular/http";
import { Observable } from "rxjs/Observable";

// App
import { AppConfig } from "../app.config";
import { Gene } from "../models/gene.model";
import { GET, POST, Server } from "../models/server.model";

@Injectable()
export class DetailsService {
  private serverIDs = AppConfig.SERVERS.map((s) => s.id);

  constructor(private http: Http) { }

  // getGeneDetails(gene: Gene, success: (e) => void, failure = (e) => {}): void {
  getGeneDetails(gene: Gene, success: (e) => void): void {
    const idx = this.serverIDs.indexOf(gene.source);
    if (idx !== -1) {
      const s: Server = AppConfig.SERVERS[idx];
      if (s.hasOwnProperty("geneLinks")) {
        const url = s.geneLinks.url + gene.name + "/json";
        let response: Observable<Response>;
        if (s.geneLinks.type === GET) {
          response = this.http.get(url, {});
        } else {
          response = this.http.post(url, {});
        }
        response.subscribe((res) => {
          success(res.json());
        });
      } else {
        // failure(s.id + " doesn't serve gene detail requests");
      }
    } else {
      // failure("invalid source: " + gene.source);
    }
  }
}
