// Angular + dependencies
import { Store } from '@ngrx/store';

// App
import { AppStore } from '../models/app-store.model';

export abstract class AppRouteService {
  protected _route: string;

  constructor(store: Store<AppStore>) {
    store.select('route')
      .subscribe(route => {
        this._route = (route as string);
      });
  }
}
