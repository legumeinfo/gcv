// Angular
import { Component } from "@angular/core";
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
              private tourService: TourService) {  // resume tours from anywhere
    // make single page app navigation available outside of Angular
    window.gcvGo = (url) => {
      const tree = router.parseUrl(url);
      const path = tree.root.children[PRIMARY_OUTLET].toString();
      const queryParams = tree.queryParams;
      store.dispatch(new routerActions.Go({
        path: [path],
        query: queryParams,
        extras: { replaceUrl: false }
      }));
    };
  }
}
