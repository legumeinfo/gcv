// Angular
import { Component, NgZone } from "@angular/core";
import { PRIMARY_OUTLET, Router } from "@angular/router";
// store
import { Store } from "@ngrx/store";
import * as routerActions from "../store/actions/router.actions";
import * as fromRoot from "../store/reducers";
// App
import { TourService } from "../services";

declare var window: any;

@Component({
  selector: "app-root",
  template: "<router-outlet></router-outlet>",
})
export class AppComponent {
  constructor(private router: Router,
              private store: Store<fromRoot.State>,
              private tourService: TourService,  // resume tours from anywhere
              private zone: NgZone) {
    // make the app's single page navigation available outside of Angular, but
    // ensure that the function always executes in the AppComponent context by
    // binding this
    window.gcvGo = this.navigate.bind(this);
  }

  // performs an Angular navigation while ensuring that it's executed in within
  // the Angular zone
  private navigate(url): void {
    this.zone.run(() => {
      const tree = this.router.parseUrl(url);
      const path = tree.root.children[PRIMARY_OUTLET].toString();
      const queryParams = tree.queryParams;
      this.store.dispatch(new routerActions.Go({
        path: [path],
        query: queryParams,
        extras: {replaceUrl: false}
      }));
    });
  }
}
