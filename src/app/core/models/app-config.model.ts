import { Request, Server, isServer } from './server.model';


export class Brand {
  favicon?: string;
  url?: string;
  img?: string;
  name?: string;
  slogan?: string;
  hide?: boolean;
}


export function isBrand(instance: any): instance is Brand {
  const brand = <Brand>instance;
  return brand !== null &&
  (brand.favicon === undefined || typeof brand.favicon === 'string') &&
  (brand.url === undefined || typeof brand.url === 'string') &&
  (brand.img === undefined || typeof brand.img === 'string') &&
  (brand.name === undefined || typeof brand.name === 'string') &&
  (brand.slogan === undefined || typeof brand.slogan === 'string') &&
  (brand.hide === undefined || typeof brand.hide === 'boolean');
}


export class Communication {
  communicate?: boolean;
  channel?: string;
}


export function isCommunication(instance: any): instance is Communication {
  const communication = <Communication>instance;
  return communication !== null &&
  (communication.communicate === undefined || typeof communication.communicate === 'boolean') &&
  (communication.channel === undefined || typeof communication.channel === 'string');
}


export class DashboardView {
  img?: string;  // URL to example screenshot
  caption?: string;
}


export function isDashboardView(instance: any): instance is DashboardView {
  const view = <DashboardView>instance;
  return view !== null &&
  (view.img === undefined || typeof view.img === 'string') &&
  (view.caption === undefined || typeof view.caption === 'string');
}


export class Dashboard {
  gcvScreenshot?: DashboardView;
  trackScreenshot?: DashboardView;
  microsyntenyScreenshot?: DashboardView;
  dotplotsScreenshot?: DashboardView;
  macrosyntenyScreenshot?: DashboardView;
  examples?: string[];  // each string should contain HTML with a description and link to an example
}


export function isDashboard(instance: any): instance is Dashboard {
  const dashboard = <Dashboard>instance;
  return dashboard !== null &&
  (dashboard.gcvScreenshot === undefined || isDashboardView(dashboard.gcvScreenshot)) &&
  (dashboard.trackScreenshot === undefined || isDashboardView(dashboard.trackScreenshot)) &&
  (dashboard.microsyntenyScreenshot === undefined || isDashboardView(dashboard.microsyntenyScreenshot)) &&
  (dashboard.dotplotsScreenshot === undefined || isDashboardView(dashboard.dotplotsScreenshot)) &&
  (dashboard.macrosyntenyScreenshot === undefined || isDashboardView(dashboard.macrosyntenyScreenshot)) &&
  (dashboard.examples === undefined || dashboard.examples.every((e) => typeof e === 'string'));
}


export class Miscellaneous {
  searchHelpText?: string;
}


export function isMiscellaneous(instance: any): instance is Miscellaneous {
  const miscellaneous = <Miscellaneous>instance;
  return miscellaneous !== null &&
  (miscellaneous.searchHelpText === undefined || typeof miscellaneous.searchHelpText === 'string');
}


export class Tour {
  script: string;
  name: string;
}


export function isTour(instance: any): instance is Tour {
  const tour = <Tour>instance;
  return tour !== null &&
  tour.script !== undefined && typeof tour.script === 'string' &&
  tour.name !== undefined && typeof tour.name === 'string';
}


export class AppConfig {

  // attributes

  private static _instance: AppConfig;

  brand?: Brand;
  communication?: Communication;
  dashboard?: Dashboard;
  miscellaneous?: Miscellaneous;
  tours?: Tour[];
  servers: Server[];

  // constructor

  constructor() {
    if (AppConfig._instance){
      throw new Error('AppConfig is a singleton and has already been instantiated');
    }
    AppConfig._instance = this;
  }

  // getters/setters

  public static get instance(): AppConfig {
    return this._instance;
  }
  public static get brand(): Brand {
    return this._instance.brand;
  }
  public static get communication(): Communication {
    return this._instance.communication;
  }
  public static get dashboard(): Dashboard {
    return this._instance.dashboard;
  }
  public static get miscellaneous(): Miscellaneous {
    return this._instance.miscellaneous;
  }
  public static get tours(): Tour[] {
    return this._instance.tours;
  }
  public static get servers(): Server[] {
    return this._instance.servers;
  }

  // public methods

  public getDefaultServer(): Server {
    if (this.servers.length > 0) {
      return this.servers[0];
    }
    return new Server();
  }
  public static getDefaultServer(): Server {
    return this._instance.getDefaultServer();
  }

  public getServer(id: string): Server|undefined {
    let server: Server;
    this.servers.forEach((s) => {
      if (s.id === id) {
        server = s;
      }
    });
    return server;
  }
  public static getServer(id: string): Server|undefined {
    return this._instance.getServer(id);
  }

  public getServerRequest(serverID: string, requestType: string): Request {
    let server: Server;
    const i = this.servers.map((s) => s.id).indexOf(serverID);
    if (i > -1) {
      server = this.servers[i];
    } else {
      throw new ConfigError('\'' + serverID + '\' is not a valid server ID');
    }
    if (!server.hasOwnProperty(requestType)) {
      throw new ConfigError('\'' + serverID + '\' does not support requests of type \'' + requestType + '\'');
    }
    return server[requestType];
  }
  public static getServerRequest(serverID: string, requestType: string): Request {
    return this._instance.getServerRequest(serverID, requestType);
  }

  public getServerIDs(): string[] {
    return this.servers.map((s) => s.id)
  }
  public static getServerIDs(): string[] {
    return this._instance.getServerIDs();
  }
}


export class ConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigError';
  }
}
