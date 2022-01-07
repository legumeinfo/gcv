// Angular
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
// app
import { AppConfig, ConfigError,
  Brand, isBrand,
  Communication, isCommunication,
  Dashboard, isDashboard,
  DefaultParameters, isDefaultParameters,
  Miscellaneous, isMiscellaneous,
  Server, isServer,
  Tour, isTour,
  Request } from '@gcv/core/models';
import { objectMergeDeep } from '@gcv/core/utils';


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
  defaultParameters: {
    gene: {
      macroSynteny: {
        matched: 20,
        intermediate: 10,
        mask: 10,
      },
      macroSyntenyOrder: 'chromosome',
      microSynteny: {
        neighbors: 10,
        matched: 4,
        intermediate: 5,
      },
      microSyntenyAlignment: {
        algorithm:  'repeat',
        match: 10,
        mismatch: -1,
        gap: -1,
        score: 30,
        threshold: 25,
      },
      microSyntenyClustering: {
        linkage: 'average',
        cthreshold: 20,
      },
      microSyntenyOrder: 'distance',
    },
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
        this.defaultParameters = this._parseDefaultParameters(config);
        this.miscellaneous = this._parseMiscellaneous(config);
        this.tours = this._parseTours(config);
        this.servers = this._parseServers(config);
        // recursively freeze all configurations
        this._freezeObject(this.brand);
        this._freezeObject(this.communication);
        this._freezeObject(this.dashboard);
        this._freezeObject(this.defaultParameters);
        this._freezeObject(this.miscellaneous);
        this._freezeObject(this.tours);
        this._freezeObject(this.servers);
        Object.freeze(this);
      });
  }

  // helpers

  private _parseError(entry: string): void {
    throw new ConfigError(`Config "${entry}" entry is invalid`);
  }

  // parsers

  private _parseBrand(config: AppConfig): Brand {
    const brand = objectMergeDeep({},
        defaultConfig.brand || {},
        config.brand || {},
      );
    if (!isBrand(brand)) {
      this._parseError('brand');
    }
    const {favicon, url, img, name, slogan, hide, ...rest} = brand;
    return {favicon, url, img, name, slogan, hide} as Brand;
  }

  private _parseCommunication(config: AppConfig): Communication {
    const communication = objectMergeDeep({},
        defaultConfig.communication || {},
        config.communication || {},
      );
    if (!isCommunication(communication)) {
      this._parseError('communication');
    }
    const {communicate, channel, ...rest} = communication;
    return {communicate, channel} as Communication;
  }

  private _parseDashboard(config: AppConfig): Dashboard {
    const dashboard = objectMergeDeep({},
        defaultConfig.dashboard || {},
        config.dashboard || {},
      );
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

  private _parseDefaultParameters(config: AppConfig): DefaultParameters {
    const defaultParameters = objectMergeDeep({},
        defaultConfig.defaultParameters || {},
        config.defaultParameters || {},
      );
    if (!isDefaultParameters(defaultParameters)) {
      this._parseError('defaultParameters');
    }
    const {gene, ...rest} = defaultParameters;
    return {gene} as DefaultParameters;
  }

  private _parseMiscellaneous(config: AppConfig): Miscellaneous {
    const miscellaneous = objectMergeDeep({},
        defaultConfig.miscellaneous || {},
        config.miscellaneous || {},
      );
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
