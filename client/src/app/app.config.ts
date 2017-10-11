import { Http }               from '@angular/http';
import { Inject, Injectable } from '@angular/core';
import { Observable }         from 'rxjs/Rx';

declare var document: any;

@Injectable()
export class AppConfig {

  public static SERVERS: Array<any> = [];  // later frozen to be "const"

  private config: Object = {};

  constructor(private http: Http) { }

  // general support for namespace function strings
  private _executeFunctionByName(functionName, context, args): any {
    args = [].slice.call(arguments).splice(2);
    let namespaces = functionName.split(".");
    let func = namespaces.pop();
    for(let i = 0; i < namespaces.length; i++) {
      context = context[namespaces[i]];
    }
    return context[func].apply(context, args);
  }

  // add JavaScript to document head
  private _loadScript(src: string): Promise<any> {
    return new Promise((resolve, reject) => {
      // load script
      let script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = src;
      if (script.readyState) {  //IE
        script.onreadystatechange = () => {
          if (script.readyState === 'loaded' ||
              script.readyState === 'complete') {
            script.onreadystatechange = null;
            resolve();
          }
        };
      } else {  // others
        script.onload = resolve;
      }
      script.onerror = reject;
      document.getElementsByTagName('head')[0].appendChild(script);
    });
  }

  private _loadServers(servers: Array<any>): void {
    servers.forEach(s => {
      if (s.hasOwnProperty('macroColors')
      &&  s.macroColors.hasOwnProperty('scriptUrl')
      &&  s.macroColors.hasOwnProperty('functionName')) {
        this._loadScript(s.macroColors['scriptUrl'] || '').then(
          () => {
            s.macroColors.function = (args) => {
              return this._executeFunctionByName(s.macroColors.functionName, window, args);
            };
          }, error => {
            console.log(error);
            delete s.macroColors;
          }
        );
      } else {
        delete s.macroColors;
      }
    });
    AppConfig.SERVERS = servers;
    Object.freeze(AppConfig.SERVERS);
  }

  public getConfig(key: any): any {
    return this.config[key];
  }

  public getServer(id: String): Object {
    let server = undefined;
    AppConfig.SERVERS.forEach(s => {
      if (s.id === id) server = s;
    });
    return server;
  }

  public load(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.get('../config.json').map(res => res.json()).catch((error: any):any => {
        console.log('Configuration file "config.json" could not be read');
        resolve(true);
        return Observable.throw(error || 'Server error');
      }).subscribe(responseData => {
        this.config = responseData || {};
        this._loadServers(this.getConfig('servers') || AppConfig.SERVERS);
        resolve(true);
      });
    });
  }
}
