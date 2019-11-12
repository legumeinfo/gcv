// Angular
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
// store
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import * as layoutActions from '@gcv/gene/store/actions/layout.actions';
import * as fromRoot from '@gcv/gene/store/reducers';
import * as fromLayout from '@gcv/gene/store/selectors/layout';
// app
import { HttpService } from '@gcv/core/services/http.service';


@Injectable()
export class LayoutService extends HttpService {

  constructor(private _http: HttpClient,
              private _store: Store<fromRoot.State>)
  {
    super(_http);
  }

  getLeftSliderState(): Observable<boolean> {
    return this._store.select(fromLayout.getShowSidenav);
  }

  closeLeftSlider(): void {
    this._store.dispatch(layoutActions.CloseSidenav());
  }

  openLeftSlider(): void {
    this._store.dispatch(layoutActions.OpenSidenav());
  }

  toggleLeftSlider(): void {
    this._store.dispatch(layoutActions.ToggleSidenav());
  }

}
