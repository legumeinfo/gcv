// Angular
import { Http, Response } from '@angular/http';
import { Injectable }     from '@angular/core';
import { Observable }     from 'rxjs/Observable';

// App
import { AppConfig }         from '../app.config';
import { Gene }              from '../models/gene.model';
import { GET, POST, Server } from '../models/server.model';

@Injectable()
export class DetailsService {
  private _serverIDs = AppConfig.SERVERS.map(s => s.id);

  constructor(private _http: Http) { }

  getGeneDetails(gene: Gene, success: Function, failure = e => {}): void {
    let idx = this._serverIDs.indexOf(gene.source);
    if (idx != -1) {
      let s: Server = AppConfig.SERVERS[idx];
      if (s.hasOwnProperty('geneLinks')) {
        let url = s.geneLinks.url + gene.name + '/json';
        let response: Observable<Response>;
        if (s.geneLinks.type === GET)
          response = this._http.get(url, {});
        else
          response = this._http.post(url, {});
        response.subscribe(res => {
          success(res.json());
        }, failure);
      } else {
        failure(s.id + " doesn't serve gene detail requests");
      }
    } else {
      failure('invalid source: ' + gene.source);
    }
  }
}
