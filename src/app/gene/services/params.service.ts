// Angular
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
// store
import { Store } from '@ngrx/store';
import * as routerActions from '@gcv/store/actions/router.actions';
import * as fromRoot from '@gcv/store/reducers';
import * as fromParams from '@gcv/gene/store/selectors/params/';
// app
import {
  AlignmentParams,
  AnnotationParams,
  FigureParams,
  FigureSpec,
  BlockParams,
  ClusteringParams,
  MacroFilterParams,
  MacroOrderParams,
  MicroFilterParams,
  MicroOrderParams,
  Params,
  PinChange,
  PinMode,
  PinParams,
  QueryParams,
  changePins,
  serializeFigureSpec,
  SourceParams,
} from '@gcv/gene/models/params';
import { HttpService } from '@gcv/core/services/http.service';

@Injectable()
export class ParamsService extends HttpService {
  private _http: HttpClient;
  private _store = inject<Store<fromRoot.State>>(Store);

  constructor() {
    const _http = inject(HttpClient);

    super(_http);

    this._http = _http;
  }

  // the analysis parameters
  getParams(): Observable<Params> {
    return this._store.select(fromParams.getParams);
  }

  getAlignmentParams(): Observable<AlignmentParams> {
    return this._store.select(fromParams.getAlignmentParams);
  }

  getBlockParams(): Observable<BlockParams> {
    return this._store.select(fromParams.getBlockParams);
  }

  getClusteringParams(): Observable<ClusteringParams> {
    return this._store.select(fromParams.getClusteringParams);
  }

  getMacroFilterParams(): Observable<MacroFilterParams> {
    return this._store.select(fromParams.getMacroFilterParams);
  }

  getMacroOrderParams(): Observable<MacroOrderParams> {
    return this._store.select(fromParams.getMacroOrderParams);
  }

  getMicroFilterParams(): Observable<MicroFilterParams> {
    return this._store.select(fromParams.getMicroFilterParams);
  }

  getMicroOrderParams(): Observable<MicroOrderParams> {
    return this._store.select(fromParams.getMicroOrderParams);
  }

  getQueryParams(): Observable<QueryParams> {
    return this._store.select(fromParams.getQueryParams);
  }

  getSourceParams(): Observable<SourceParams> {
    return this._store.select(fromParams.getSourceParams);
  }

  getPinParams(): Observable<PinParams> {
    return this._store.select(fromParams.getPinParams);
  }

  getFigureParams(): Observable<FigureParams> {
    return this._store.select(fromParams.getFigureParams);
  }

  // opens, changes or (with null) closes the figure
  updateFigure(spec: FigureSpec | null): void {
    this.updateParams({ fig: spec });
  }

  // changes the pins in the URL; returns the pins it set
  async updatePins(mode: PinMode, change: PinChange = {}): Promise<PinParams> {
    const pins = changePins(
      await firstValueFrom(this.getPinParams()),
      mode,
      change,
    );
    // the default label setting stays out of the URL
    const pinlabels = pins.pinlabels === 'full' ? null : pins.pinlabels;
    this.updateParams({ ...pins, pinlabels });
    return pins;
  }

  // Lists go in the URL comma-separated; an empty list or null removes its
  // parameter.
  updateParams(
    params:
      Params | { [K in keyof AnnotationParams]?: AnnotationParams[K] | null },
  ): void {
    const path = [];
    const query = Object.fromEntries(
      Object.entries(params).map(([key, value]) => {
        if (key === 'fig' && value !== null && value !== undefined) {
          return [key, serializeFigureSpec(value as FigureSpec)];
        }
        if (!Array.isArray(value)) {
          return [key, value];
        }
        return [key, value.length === 0 ? null : value.join(',')];
      }),
    );
    this._store.dispatch(routerActions.go({ path, query }));
  }
}
