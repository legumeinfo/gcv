// Angular
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
// app
import { AppConfig, ConfigError,
  Brand, isBrand,
  Communication, isCommunication,
  Dashboard, isDashboard,
  Miscellaneous, isMiscellaneous,
  Server, isServer,
  Tour, isTour,
  Request } from '@gcv/core/models';


const defaultConfig = {
  brand: {
    hide: true,
  },
  communication: {},
  dashboard: {
    gcvScreenshot: {
      img: '/config/img/instructions-gcv.png',
    },
    trackScreenshot: {
      img: '/config/img/instructions-track.png',
    },
    microsyntenyScreenshot: {
      img: '/config/img/instructions-microsynteny.png',
    },
    dotplotsScreenshot: {
      img: '/config/img/instructions-dotplots.png',
    },
    macrosyntenyScreenshot: {
      img: '/config/img/instructions-macrosynteny.png',
    },
    examples: [],
  },
  miscellaneous: {},
  tours: [],
};


@Injectable()
export class AppConfigService extends AppConfig {

  constructor(private http: HttpClient) {
    super();
  }

  public load(): Promise<any> {
    return this.http.get<AppConfig>('config/config.json')
      .toPromise()
      .then((config) => {
        // parse and save configurations
        this.brand = this._parseBrand(config);
        this.communication = this._parseCommunication(config);
        this.dashboard = this._parseDashboard(config);
        this.miscellaneous = this._parseMiscellaneous(config);
        this.tours = this._parseTours(config);
        this.servers = this._parseServers(config);
        // recursively freeze all configurations
        this._freezeObject(this.brand);
        this._freezeObject(this.communication);
        this._freezeObject(this.dashboard);
        this._freezeObject(this.miscellaneous);
        this._freezeObject(this.tours);
        this._freezeObject(this.servers);
        Object.freeze(this);
      });
  }

  private _parseError(entry: string): void {
    throw new ConfigError(`Config "${entry}" entry is invalid`);
  }

  private _parseBrand(config: AppConfig): Brand {
    const brand = {...(defaultConfig.brand || {}), ...(config.brand || {})};
    if (!isBrand(brand)) {
      this._parseError('brand');
    }
    const {favicon, url, img, name, slogan, hide, ...rest} = brand;
    return {favicon, url, img, name, slogan, hide} as Brand;
  }

  private _parseCommunication(config: AppConfig): Communication {
    const communication = {
        ...(defaultConfig.communication),
        ...(config.communication || {}),
      };
    if (!isCommunication(communication)) {
      this._parseError('communication');
    }
    const {communicate, channel, ...rest} = communication;
    return {communicate, channel} as Communication;
  }

  private _parseDashboardView(dashboard: Dashboard, view: string): void {
    const dashboardView = {
        ...(defaultConfig.dashboard[view] || {}),
        ...(dashboard[view] || {}),
      };
    dashboard[view] = dashboardView;
  }

  private _parseDashboard(config: AppConfig): Dashboard {
    const dashboard = config.dashboard || {};
    this._parseDashboardView(dashboard, 'gcvScreenshot'); 
    this._parseDashboardView(dashboard, 'trackScreenshot');
    this._parseDashboardView(dashboard, 'microsyntenyScreenshot');
    this._parseDashboardView(dashboard, 'dotplotScreenshot');
    this._parseDashboardView(dashboard, 'macrosyntenyScreenshot');
    if (!isDashboard(config.dashboard)) {
      this._parseError('dashboard');
    }
    const {
        gcvScreenshot,
        trackScreenshot,
        microsyntenyScreenshot,
        dotplotsScreenshot,
        macrosyntenyScreenshot,
        examples,
        ...rest
      } = config.dashboard;
    // TODO: set defaults
    return {
      gcvScreenshot,
      trackScreenshot,
      microsyntenyScreenshot,
      dotplotsScreenshot,
      macrosyntenyScreenshot,
      examples
    } as Dashboard;
  }

  private _parseMiscellaneous(config: AppConfig): Miscellaneous {
    const miscellaneous = {
        ...(defaultConfig.miscellaneous || {}),
        ...(config.miscellaneous || {}),
      };
    if (!isMiscellaneous(miscellaneous)) {
      this._parseError('miscellaneous');
    }
    const {searchHelpText, ...rest} = miscellaneous;
    return {searchHelpText} as Miscellaneous;
  }

  private _parseTours(config: AppConfig): Tour[] {
    const tours = (defaultConfig.tours || []) || (config.tours || []);
    if (!tours.every((t) => isTour(t))) {
      this._parseError('tours');
    }
    return tours.map((t): Tour => {
      const {script, name, ...rest} = t;
      return {script, name} as Tour;
    });
  }

  private _parseServers(config: AppConfig): Server[] {
    if (config.servers === undefined ||
        !config.servers.every((s) => isServer(s))) {
      this._parseError('servers');
    }
    const servers: Server[] = config.servers.map((s): Server => {
        const {
            id,
            name,
            genes,
            chromosome,
            microSearch,
            blocks,
            search,
            region,
            geneLinks,
            familyTreeLink,
            macroColors,
            ...rest
          } = s;
        return {
          id,
          name,
          genes,
          chromosome,
          microSearch,
          blocks,
          search,
          region,
          geneLinks,
          familyTreeLink,
          macroColors,
        } as Server;
      });
    return servers;
  }

  private _freezeObject(target): void {
    Object.freeze(target);
    for (const property in target) {
      if (target.hasOwnProperty(property)) {
        const value = target[property];
        if (typeof value === 'object' && value !== null) {
          this._freezeObject(value);
        }
      }
    };
  }
}
