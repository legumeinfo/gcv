// Angular
import { Inject, Injectable } from "@angular/core";
import { Observable } from "rxjs/Rx";
// app
import { Server } from "./models/server.model";
const configFile = require("../config.json");

declare var document: any;

@Injectable()
export class AppConfig {

  public static SERVERS: any[] = [];  // later frozen to be "const"

  private config: object = {};

  public getConfig(key: any): any {
    return this.config[key];
  }

  public getServer(id: string): Server {
    let server;
    AppConfig.SERVERS.forEach((s) => {
      if (s.id === id) {
        server = s;
      }
    });
    return server;
  }

  public load() {
    this.config = configFile;
    this._loadServers(this.getConfig("servers") || AppConfig.SERVERS);
  }

  // general support for namespace function strings
  private _executeFunctionByName(functionName, context, args): any {
    args = [].slice.call(arguments).splice(2);
    const namespaces = functionName.split(".");
    const func = namespaces.pop();
    for (const space of namespaces) {
      context = context[space];
    }
    return context[func].apply(context, args);
  }

  // add JavaScript to document head
  private _loadScript(src: string): Promise<any> {
    return new Promise((resolve, reject) => {
      // load script
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.src = src;
      if (script.readyState) {  // IE
        script.onreadystatechange = () => {
          if (script.readyState === "loaded" ||
              script.readyState === "complete") {
            script.onreadystatechange = null;
            resolve();
          }
        };
      } else {  // others
        script.onload = resolve;
      }
      script.onerror = reject;
      document.getElementsByTagName("head")[0].appendChild(script);
    });
  }

  private _loadServers(servers: any[]): void {
    servers.forEach((s) => {
      if (s.macroColors !== undefined
      &&  s.macroColors.scriptUrl !== undefined
      &&  s.macroColors.functionName !== undefined) {
        this._loadScript(s.macroColors.scriptUrl || "").then(
          () => {
            s.macroColors.function = (args) => {
              return this._executeFunctionByName(s.macroColors.functionName, window, args);
            };
          }, (error) => {
            delete s.macroColors;
          },
        );
      } else {
        delete s.macroColors;
      }
    });
    AppConfig.SERVERS = servers;
    Object.freeze(AppConfig.SERVERS);
  }
}
