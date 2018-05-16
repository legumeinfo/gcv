// Angular
import { Inject, Injectable } from "@angular/core";
import { Observable } from "rxjs/Rx";
// app
import { Server } from "./models/server.model";
const configFile = require("../config.json");

declare var document: any;

@Injectable()
export class AppConfig {

  // later frozen to be "const"
  public static SERVERS: any[] = [];
  public static BRAND: any;
  public static DASHBOARD: any;
  public static MISCELLANEOUS: any;

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

  public load(): Promise<any> {
    this.config = configFile;
    this._loadBrand(this.getConfig("brand") || AppConfig.BRAND);
    this._loadDashboard(this.getConfig("dashboard") || AppConfig.DASHBOARD);
    this._loadMiscellaneous(this.getConfig("miscellaneous") || AppConfig.MISCELLANEOUS);
    return this._loadServers(this.getConfig("servers") || AppConfig.SERVERS);
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

  private _setAndFreezeServers(servers: any[]): void {
    AppConfig.SERVERS = servers;
    Object.freeze(AppConfig.SERVERS);
  }

  private _loadBrand(brand: any): void {
    AppConfig.BRAND = brand;
    Object.freeze(AppConfig.BRAND);
  }

  private _loadDashboard(dashboard: any): void {
    if (dashboard.search.img === undefined) {
      dashboard.search.img = require("../assets/img/search.png");
    }
    if (dashboard.multi.img === undefined) {
      dashboard.multi.img = require("../assets/img/multi.png");
    }
    AppConfig.DASHBOARD = dashboard;
    Object.freeze(AppConfig.DASHBOARD);
  }

  private _loadMiscellaneous(miscellaneous: any): void {
    AppConfig.MISCELLANEOUS = miscellaneous;
    Object.freeze(AppConfig.MISCELLANEOUS);
  }

  private _loadServers(servers: any[]): Promise<any> {
    return Promise.all(
      servers
        .filter((s) => {
          return s.macroColors !== undefined &&
                 s.macroColors.scriptUrl !== undefined &&
                 s.macroColors.functionName !== undefined;
        })
        .map((s) => {
          return this._loadScript(s.macroColors.scriptUrl || "").then(
            () => {
              s.macroColors.function = (args) => {
                return this._executeFunctionByName(s.macroColors.functionName, window, args);
              };
            }, (error) => {
              delete s.macroColors;
              console.log("Failed to load macro-synteny colors");
            },
          );
        })
      )
      .then(() => {
        this._setAndFreezeServers(servers);
      })
      .catch((error) => {
        this._setAndFreezeServers(servers);
      });
  }
}
