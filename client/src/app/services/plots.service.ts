// Angular
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
// store
import { Observable } from "rxjs/Observable";
import { _throw } from "rxjs/observable/throw";
import { catchError, map } from "rxjs/operators";
import { Store } from "@ngrx/store";
import * as globalPlotsActions from "../actions/global-plots.actions";
import * as localPlotsActions from "../actions/local-plots.actions";
import * as fromRoot from "../reducers";
import * as fromGlobalPlots from "../reducers/global-plots.store";
import * as fromLocalPlots from "../reducers/local-plots.store";
// app
import { Gene } from "../models/gene.model";
import { Group } from "../models/group.model";
import { MicroTracks } from "../models/micro-tracks.model";
import { HttpService } from "./http.service";

@Injectable()
export class PlotsService extends HttpService {
  // TODO: make this more reactive
  localPlots: Observable<Group[]>;
  selectedLocalPlot: Observable<Group>
  selectedGlobalPlot: Observable<Group>;
  selectedLocalPlotID: Observable<string>;
  selectedGlobalPlotID: Observable<string>;

  constructor(private _http: HttpClient, private store: Store<fromRoot.State>) {
    super(_http);
    // initialize observables
    this.localPlots = store.select(fromLocalPlots.getAllPlots);
    this.selectedLocalPlotID = store.select(fromLocalPlots.getSelectedPlotID);
    this.selectedGlobalPlotID = store.select(fromGlobalPlots.getSelectedPlotID);
    this.selectedLocalPlot = store.select(fromLocalPlots.getSelectedPlot);
    this.selectedGlobalPlot = store.select(fromGlobalPlots.getSelectedPlot);
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

  selectLocal(id: string): void {
    this.store.dispatch(new localPlotsActions.Select({id}));
  }

  selectGlobal(id: string): void {
    this.store.dispatch(new globalPlotsActions.GetOrSelect({id}));
  }

  getGlobalFromLocal(reference: Group, local: Group): Observable<Group> {
    const body = {
      chromosome: local.chromosome_name,
      query: reference.genes.map((g) => g.family),
    };
    return this._makeRequest<Gene[]>(local.source, "plotGlobal", body).pipe(
      map((genes) => {
        const familyCoordinates = this._genesToFamilyCoordinates(reference.genes);
        genes.forEach((gene) => gene.source = local.source);
        return {
          ...local,
          genes: this._getPlotPoints(familyCoordinates, genes),
        };
      }),
      catchError((error) => _throw(error)),
    );
  }

  private _getPlot(familyCoordinates: any, track: Group): Group {
    return {
      ...track,
      genes: this._getPlotPoints(familyCoordinates, track.genes),
    };
  }

  private _getPlotPoints(familyCoordinates: any, genes: Gene[]): Gene[] {
    return genes.reduce((points, gene) => {
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
    }, []);
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
}
