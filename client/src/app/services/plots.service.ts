// Angular
import { Injectable } from "@angular/core";
import { Http, RequestOptionsArgs , Response } from "@angular/http";
import { Observable } from "rxjs/Observable";
// import { Store } from "@ngrx/store";

// App
import { AppConfig } from "../app.config";
import { AppRoutes } from "../constants/app-routes";
import { StoreActions } from "../constants/store-actions";
import { argsByValue } from "../decorators/args-by-value.decorator";
import { AppStore } from "../models/app-store.model";
import { Gene } from "../models/gene.model";
import { Group } from "../models/group.model";
import { MicroTracks } from "../models/micro-tracks.model";
import { GET, POST, Server } from "../models/server.model";
import { AppRouteService } from "./app-route.service";

@Injectable()
export class PlotsService extends AppRouteService {
  // TODO: make this more reactive
  localPlots: Observable<Group[]>;
  selectedPlot: Observable<Group>;

  private query: any[];
  private familyMap: any;

  private globalPlots: Group[];
  private localPlotsCopy: Group[];
  private selectedPlotCopy: Group;

  private serverIDs = AppConfig.SERVERS.map((s) => s.id);

  constructor(private http: Http /*private _store: Store<AppStore>*/) {
    super(/*_store*/);

    // initialize observables
    // this.localPlots   = this._store.select("localPlots");
    // this.selectedPlot = this._store.select("selectedPlot");
    // let microTracks   = this._store.select<MicroTracks>("microTracks");
    // let globalPlots   = this._store.select<Group[]>("globalPlots");
    this.localPlots = Observable.empty<Group[]>();
    this.selectedPlot = Observable.empty<Group>();
    const microTracks = Observable.empty<MicroTracks>();
    const globalPlots = Observable.empty<Group[]>();

    // subscribe to changes that update local plots
    this.localPlots
      .filter((plot) => this.route === AppRoutes.SEARCH)
      .subscribe((plots) => this.localPlotsCopy = plots);

    // subscribe to changes that update the selected plot
    this.selectedPlot
      .filter((plot) => this.route === AppRoutes.SEARCH)
      .subscribe((plot) => this.selectedPlotCopy = plot);

    // subscribe to changes
    microTracks
      .filter((tracks) => this.route === AppRoutes.SEARCH)
      .subscribe((tracks: MicroTracks) => {
        this._parseQuery(tracks);
        // let localPlots = this._plotTracks(tracks),
        //     action1    = {
        //         type: StoreActions.ADD_LOCAL_PLOTS,
        //         payload: localPlots
        //       };
        // this._store.dispatch(action1);
        // let action2 = {type: StoreActions.ADD_GLOBAL_PLOTS, payload: []};
        // this._store.dispatch(action2);
      });

    globalPlots
      .filter((plots) => this.route === AppRoutes.SEARCH)
      .subscribe((plots: Group[]) => {
        this.globalPlots = plots;
      });
  }

  selectPlot(plot: Group): void {
    // this._store.dispatch({type: StoreActions.SELECT_PLOT, payload: plot});
  }

  getSelectedGlobal(success, failure = (e) => { /* noop */ }): void {
    const local = this.getSelectedLocal();
    if (local !== undefined) {
      let idx = this.globalPlots.map((p) => p.id).indexOf(this.selectedPlotCopy.id);
      if (idx !== -1) {
        success(this.globalPlots[idx]);
      }
      const source = this.selectedPlotCopy.source;
      idx = this.serverIDs.indexOf(source);
      if (idx !== -1) {
        const s: Server = AppConfig.SERVERS[idx];
        if (s.hasOwnProperty("plotGlobal")) {
          const args = {
            chromosome: local.chromosome_id,
            query: this.query,
          } as RequestOptionsArgs;
          let response: Observable<Response>;
          if (s.plotGlobal.type === GET) {
            response = this.http.get(s.plotGlobal.url, args);
          } else {
            response = this.http.post(s.plotGlobal.url, args);
          }
          response.subscribe((res) => {
            const plot = Object.assign({}, local);
            plot.genes = this._plotGenes(res.json());
            for (const gene of plot.genes) {
              gene.source = plot.source;
            }
            // this._store.dispatch({type: StoreActions.UPDATE_GLOBAL_PLOTS,
            //   payload: plot})
            success(plot);
          }, failure);
        } else {
          failure(source + " doesn't support global plot requests");
        }
      } else {
        failure("invalid source: " + source);
      }
    } else {
      failure("invalid plot selection");
    }
  }

  getSelectedLocal(): Group {
    if (this.selectedPlotCopy !== undefined) {
      const idx = this.localPlotsCopy.map((p) => p.id).indexOf(this.selectedPlotCopy.id);
      if (idx !== -1) {
        return this.localPlotsCopy[idx];
      }
    }
    return undefined;
  }

  private _parseQuery(tracks: MicroTracks): void {
    this.query = [];
    this.familyMap = {};
    if (tracks.groups.length > 0) {
      for (const g of tracks.groups[0].genes) {
        this.query.push(g.family);
        const p = (g.fmin + g.fmax) / 2;
        if (g.family in this.familyMap) {
          this.familyMap[g.family].push(p);
        } else if (g.family) {
          this.familyMap[g.family] = [p];
        }
      }
    }
  }

  private _plotGenes(genes): Gene[] {
    const plotGenes = [];
    for (const gene of genes) {
      if (gene.family in this.familyMap) {
        for (let j = 0; j < this.familyMap[gene.family].length; ++j) {
          const g = Object.assign({}, gene);
          g.x = (g.fmin + g.fmax) / 2;
          g.y = this.familyMap[g.family][j];
          plotGenes.push(g);
        }
      } else {
        const g = Object.assign({}, gene);
        g.x = (g.fmin + g.fmax) / 2;
        g.y = -1;
        plotGenes.push(g);
      }
    }
    return plotGenes;
  }

  @argsByValue()
  private _plotTracks(tracks): Group[] {
    const plots = tracks.groups;
    if (plots.length > 0) {
      for (const g of plots) {
        g.genes = this._plotGenes(g.genes);
      }
    }
    return plots;
  }
}
