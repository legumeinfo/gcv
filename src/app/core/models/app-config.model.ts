/* This file contains the models that constitute the AppConfig type as well as
 * functions for checking if objects are instances of these types. NOTE: These
 * functions are only for type checking; validation (i.e. verify values are
 * valid) should be handled by the modules that actually use the types.
 */
import { Script, isScript } from './script.model';
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
  img: string;  // URL to example screenshot
  caption: string;
  responsive?: string[];  // ["<image URL> <intrinsic image width>w", ...]
}


export function isDashboardView(instance: any): instance is DashboardView {
  const view = <DashboardView>instance;
  return view !== null &&
  (typeof view.img === 'string') &&
  (typeof view.caption === 'string') &&
  (view.responsive === undefined || (Array.isArray(view.responsive) && view.responsive.every((e) => typeof e === 'string')));
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


// replicates models in @gcv/gene/models/params so gene module isn't prematurely
// loaded
export type DefaultParameters = {
  gene: {
    macroSynteny: {
      matched: number;
      intermediate: number;
      mask: number;
      minChromosomeGenes: number;
      minChromosomeLength: number;
    };
    macroSyntenyOrder: string;
    microSynteny: {
      neighbors: number;
      matched: number;
      intermediate: number;
    };
    microSyntenyAlignment: {
      algorithm:  string;
      match: number;
      mismatch: number;
      gap: number;
      score: number;
      threshold: number;
    };
    microSyntenyClustering: {
      linkage: string;
      cthreshold: number;
    };
    microSyntenyOrder: string;
  };
}


// only validates types; invalid values will be handled by the gene module
export function isDefaultParameters(instance: any): instance is DefaultParameters {
  const defaultParameters = <DefaultParameters>instance;
  return defaultParameters !== null &&
    typeof defaultParameters.gene === 'object' &&
      typeof defaultParameters.gene.macroSynteny === 'object' &&
        typeof defaultParameters.gene.macroSynteny.matched === 'number' &&
        typeof defaultParameters.gene.macroSynteny.intermediate === 'number' &&
        typeof defaultParameters.gene.macroSynteny.mask === 'number' &&
        typeof defaultParameters.gene.macroSynteny.minChromosomeGenes === 'number' &&
        typeof defaultParameters.gene.macroSynteny.minChromosomeLength === 'number' &&
      typeof defaultParameters.gene.macroSyntenyOrder === 'string' &&
      typeof defaultParameters.gene.microSyntenyOrder === 'string' &&
      typeof defaultParameters.gene.microSynteny === 'object' &&
        typeof defaultParameters.gene.microSynteny.neighbors === 'number' &&
        typeof defaultParameters.gene.microSynteny.matched === 'number' &&
        typeof defaultParameters.gene.microSynteny.intermediate === 'number' &&
      typeof defaultParameters.gene.microSyntenyAlignment === 'object' &&
        typeof defaultParameters.gene.microSyntenyAlignment.algorithm === 'string' &&
        typeof defaultParameters.gene.microSyntenyAlignment.match === 'number' &&
        typeof defaultParameters.gene.microSyntenyAlignment.mismatch === 'number' &&
        typeof defaultParameters.gene.microSyntenyAlignment.gap === 'number' &&
        typeof defaultParameters.gene.microSyntenyAlignment.score === 'number' &&
        typeof defaultParameters.gene.microSyntenyAlignment.threshold === 'number' &&
      typeof defaultParameters.gene.microSyntenyClustering === 'object' &&
        typeof defaultParameters.gene.microSyntenyClustering.linkage === 'string' &&
        typeof defaultParameters.gene.microSyntenyClustering.cthreshold === 'number' &&
      typeof defaultParameters.gene.microSyntenyOrder === 'string';
}


export class MacroLegend {
  format?: string;
  colors?: Script;
}

export function isMacroLegend(instance: any): instance is MacroLegend {
  const macroLegend = <MacroLegend>instance;
  return macroLegend !== null &&
  (macroLegend.format === undefined || typeof macroLegend.format === 'string') &&
  (macroLegend.colors === undefined || isScript(macroLegend.colors));
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
  defaultParameters: DefaultParameters;
  macroLegend?: MacroLegend;
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

  // reflect instance attributes with static getters so they can be used without
  // dependency injection or retrieving the singleton instance

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
  public static get defaultParameters(): DefaultParameters {
    return this._instance.defaultParameters;
  }
  public static get macroLegend(): MacroLegend {
    return this._instance.macroLegend;
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
