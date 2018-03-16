// Angular
import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
// store
import { Observable } from "rxjs/Observable";
import { map } from "rxjs/operators";
import { Store } from "@ngrx/store";
import * as localPlotsActions from "../actions/local-plots.actions";
import * as fromRoot from "../reducers";
import * as fromLocalPlots from "../reducers/local-plots.store";
// app
import { AppConfig } from "../app.config";
import { AppRoutes } from "../constants/app-routes";
import { Gene } from "../models/gene.model";
import { Group } from "../models/group.model";
import { MicroTracks } from "../models/micro-tracks.model";
import { GET, POST, Server } from "../models/server.model";

@Injectable()
export class PlotsService {
  // TODO: make this more reactive
  localPlots: Observable<Group[]>;
  selectedLocalPlot: Observable<Group>;

  private query: any[];
  private familyMap: any;

  private globalPlots: Group[];
  private localPlotsCopy: Group[];
  private selectedPlotCopy: Group;

  private serverIDs = AppConfig.SERVERS.map((s) => s.id);

  constructor(private http: HttpClient, private store: Store<fromRoot.State>) {
    // initialize observables
    // this.localPlots   = this._store.select("localPlots");
    this.selectedLocalPlot = this.store.select(fromLocalPlots.getSelectedPlot)
      .filter((plot) => plot !== null);
    // let microTracks   = this._store.select<MicroTracks>("microTracks");
    // let globalPlots   = this._store.select<Group[]>("globalPlots");
    this.localPlots = Observable.empty<Group[]>();
    const microTracks = Observable.empty<MicroTracks>();
    const globalPlots = Observable.empty<Group[]>();

    // subscribe to changes that update local plots
    //this.localPlots
    //  .filter((plot) => this.route === AppRoutes.SEARCH)
    //  .subscribe((plots) => this.localPlotsCopy = plots);

    // subscribe to changes that update the selected plot
    //this.selectedPlot
    //  .filter((plot) => this.route === AppRoutes.SEARCH)
    //  .subscribe((plot) => this.selectedPlotCopy = plot);

    // subscribe to changes
    //microTracks
    //  .filter((tracks) => this.route === AppRoutes.SEARCH)
    //  .subscribe((tracks: MicroTracks) => {
    //    this._parseQuery(tracks);
    //    // let localPlots = this._plotTracks(tracks),
    //    //     action1    = {
    //    //         type: StoreActions.ADD_LOCAL_PLOTS,
    //    //         payload: localPlots
    //    //       };
    //    // this._store.dispatch(action1);
    //    // let action2 = {type: StoreActions.ADD_GLOBAL_PLOTS, payload: []};
    //    // this._store.dispatch(action2);
    //  });

    //globalPlots
    //  .filter((plots) => this.route === AppRoutes.SEARCH)
    //  .subscribe((plots: Group[]) => {
    //    this.globalPlots = plots;
    //  });
  }

  getPlot(reference: Group, track: Group): Observable<Group> {
    const familyCoordinates = this._genesToFamilyCoordinates(reference.genes);
    return Observable.create((observer) => {
      const plot = this._getPlot(familyCoordinates, track);
      observer.next(plot);
      observer.complete();
    });
  }

  getPlots(reference: Group, tracks: Group[]): Observable<Group[]> {
    const familyCoordinates = this._genesToFamilyCoordinates(reference.genes);
    return Observable.create((observer) => {
      const plots = tracks.map((track) => this._getPlot(familyCoordinates, track));
      observer.next(plots);
      observer.complete();
    });
  }

  selectLocal(plot: Group): void {
    this.store.dispatch(new localPlotsActions.Select({id: plot.id}));
  }

  selectGlobal(plot: Group): void {
    //this.store.dispatch(new globalPlotsActions.Select({id: plot.id}));
  }

  private _getPlot(familyCoordinates: any, track: Group): Group {
    return {
      ...track,
      genes: track.genes.reduce((points, gene) => {
        const family = gene.family;
        const x = (gene.fmin + gene.fmax) / 2;
        if (family in familyCoordinates) {
          for (const y of familyCoordinates[family]) {
            const point = Object.create(gene);
            point.x = x;
            point.y = y;
            points.push(point);
          }
        } else {
          const point = Object.create(gene);
          point.x = x;
          point.y = null;
          points.push(point);
        }
        return points;
      }, []),
    };
  }

  private _genesToFamilyCoordinates(genes: Gene[]): any {
    return genes.reduce((familyCoordinates, gene) => {
      const family = gene.family;
      if (family !== "") {
        if (!(family in familyCoordinates)) {
          familyCoordinates[family] = [];
        }
        const coordinate = (gene.fmin + gene.fmax) / 2;
        familyCoordinates[family].push(coordinate);
      }
      return familyCoordinates;
    }, {});
  }

  //selectPlot(plot: Group): void {
  //  // this._store.dispatch({type: StoreActions.SELECT_PLOT, payload: plot});
  //}



  //getSelectedGlobal(success, failure = (e) => { /* noop */ }): void {
  //  const local = this.getSelectedLocal();
  //  if (local !== undefined) {
  //    let idx = this.globalPlots.map((p) => p.id).indexOf(this.selectedPlotCopy.id);
  //    if (idx !== -1) {
  //      success(this.globalPlots[idx]);
  //    }
  //    const source = this.selectedPlotCopy.source;
  //    idx = this.serverIDs.indexOf(source);
  //    if (idx !== -1) {
  //      const s: Server = AppConfig.SERVERS[idx];
  //      if (s.hasOwnProperty("plotGlobal")) {
  //        const args = {
  //          chromosome: local.chromosome_id,
  //          query: this.query,
  //        } as RequestOptionsArgs;
  //        let response: Observable<Response>;
  //        if (s.plotGlobal.type === GET) {
  //          response = this.http.get(s.plotGlobal.url, args);
  //        } else {
  //          response = this.http.post(s.plotGlobal.url, args);
  //        }
  //        response.subscribe((res) => {
  //          const plot = Object.assign({}, local);
  //          plot.genes = this._plotGenes(res.json());
  //          for (const gene of plot.genes) {
  //            gene.source = plot.source;
  //          }
  //          // this._store.dispatch({type: StoreActions.UPDATE_GLOBAL_PLOTS,
  //          //   payload: plot})
  //          success(plot);
  //        }, failure);
  //      } else {
  //        failure(source + " doesn't support global plot requests");
  //      }
  //    } else {
  //      failure("invalid source: " + source);
  //    }
  //  } else {
  //    failure("invalid plot selection");
  //  }
  //}

  //getSelectedLocal(): Group {
  //  if (this.selectedPlotCopy !== undefined) {
  //    const idx = this.localPlotsCopy.map((p) => p.id).indexOf(this.selectedPlotCopy.id);
  //    if (idx !== -1) {
  //      return this.localPlotsCopy[idx];
  //    }
  //  }
  //  return undefined;
  //}

  //private _parseQuery(tracks: MicroTracks): void {
  //  this.query = [];
  //  this.familyMap = {};
  //  if (tracks.groups.length > 0) {
  //    for (const g of tracks.groups[0].genes) {
  //      this.query.push(g.family);
  //      const p = (g.fmin + g.fmax) / 2;
  //      if (g.family in this.familyMap) {
  //        this.familyMap[g.family].push(p);
  //      } else if (g.family) {
  //        this.familyMap[g.family] = [p];
  //      }
  //    }
  //  }
  //}
//
  //private _plotGenes(genes): Gene[] {
  //  const plotGenes = [];
  //  for (const gene of genes) {
  //    if (gene.family in this.familyMap) {
  //      for (let j = 0; j < this.familyMap[gene.family].length; ++j) {
  //        const g = Object.assign({}, gene);
  //        g.x = (g.fmin + g.fmax) / 2;
  //        g.y = this.familyMap[g.family][j];
  //        plotGenes.push(g);
  //      }
  //    } else {
  //      const g = Object.assign({}, gene);
  //      g.x = (g.fmin + g.fmax) / 2;
  //      g.y = -1;
  //      plotGenes.push(g);
  //    }
  //  }
  //  return plotGenes;
  //}
//
  //private _plotTracks(tracks): Group[] {
  //  const plots = tracks.groups;
  //  if (plots.length > 0) {
  //    for (const g of plots) {
  //      g.genes = this._plotGenes(g.genes);
  //    }
  //  }
  //  return plots;
  //}
}
