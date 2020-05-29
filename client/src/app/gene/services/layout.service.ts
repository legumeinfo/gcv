// Angular
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
// store
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import * as layoutActions from '@gcv/gene/store/actions/layout.actions';
import * as fromRoot from '@gcv/store/reducers';
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
    return this._store.select(fromLayout.getShowLeftSlider);
  }

  getLeftSliderContent(): Observable<string> {
    return this._store.select(fromLayout.getLeftSliderContent);
  }

  closeLeftSlider(): void {
    this._store.dispatch(layoutActions.CloseLeftSlider());
  }

  openLeftSlider(): void {
    this._store.dispatch(layoutActions.OpenLeftSlider());
  }

  toggleLeftSlider(): void {
    this._store.dispatch(layoutActions.ToggleLeftSlider());
  }

  toggleLeftSliderContent(content: string) {
    this._store.dispatch(layoutActions.ToggleLeftSliderContent({content}));
  }

}
