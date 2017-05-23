import { Http }               from '@angular/http';
import { Inject, Injectable } from '@angular/core';
import { Observable }         from 'rxjs/Rx';

@Injectable()
export class AppConfig {

  public static SERVERS: Array<any> = [];  // later frozen to be "const"

  private config: Object = {};

  constructor(private http: Http) { }

  public getConfig(key: any): any {
    return this.config[key];
  }

  public load() {
    return new Promise((resolve, reject) => {
      this.http.get('../config.json').map(res => res.json()).catch((error: any):any => {
        console.log('Configuration file "config.json" could not be read');
        resolve(true);
        return Observable.throw(error || 'Server error');
      }).subscribe(responseData => {
        this.config = responseData || {};
        AppConfig.SERVERS = this.getConfig('servers') || AppConfig.SERVERS;
        Object.freeze(AppConfig.SERVERS);
        resolve(true);
      });
    });
  }
}
