// Angular
import {
  Component,
  NgZone,
  OnInit,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { NavigationStart, PRIMARY_OUTLET, Router } from '@angular/router';
// store
import { Store } from '@ngrx/store';
import * as routerActions from '@gcv/store/actions/router.actions';
import * as fromRoot from '@gcv/store/reducers';

declare let window: any;

@Component({
  selector: 'gcv',
  template: `
    <gcv-header></gcv-header>
    <router-outlet></router-outlet>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class AppComponent implements OnInit {
  private router = inject(Router);
  private _store = inject<Store<fromRoot.State>>(Store);
  private zone = inject(NgZone);

  constructor() {
    // make the app's single page navigation available outside of Angular, but
    // ensure that the function always executes in the AppComponent context by
    // binding this
    window.gcvGo = this.navigate.bind(this);
  }

  ngOnInit() {
    // remove hash from URLs before the app router can redirect them
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        if (!!event.url && event.url.match(/^\/#/)) {
          this.router.navigate([event.url.replace('/#', '')]);
        }
      }
    });
  }

  // performs an Angular navigation while ensuring that it's executed in within
  // the Angular zone
  private navigate(url): void {
    this.zone.run(() => {
      const tree = this.router.parseUrl(url);
      const path = tree.root.children[PRIMARY_OUTLET].toString();
      const queryParams = tree.queryParams;
      this._store.dispatch(
        routerActions.go({
          path: [path],
          query: queryParams,
          extras: { replaceUrl: false },
        }),
      );
    });
  }
}
