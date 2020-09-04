// Angular
import { Component, NgZone, OnInit } from '@angular/core';
import { NavigationStart, PRIMARY_OUTLET, Router } from '@angular/router';
// store
import { Store } from '@ngrx/store';
import * as routerActions from '@gcv/store/actions/router.actions';
import * as fromRoot from '@gcv/store/reducers';
// App
import { TourService } from '@gcv/core/services';

declare var window: any;

@Component({
  selector: 'gcv',
  template: `
    <gcv-header>
      <nav class="navbar navbar-light bg-light">
        <a class="navbar-brand" href="#">
          <!-- TODO: load image, title, and subtitle from config -->
          <img src="https://getbootstrap.com/docs/4.3/assets/brand/bootstrap-solid.svg" width="30" height="30" class="d-inline-block align-top" alt="">
          LIS - Legume Information System
          <!-- TODO: subtitle -->
        </a>
        <form class="form-inline my-2 my-lg-0">
          <input class="form-control mr-sm-2" type="search" placeholder="Search" aria-label="Search">
          <button class="btn btn-outline-dark my-2 my-sm-0" type="submit">Search</button>
        </form>
      </nav>
    </gcv-header>
    <router-outlet></router-outlet>
  `,
})
export class AppComponent implements OnInit {

  constructor(private router: Router,
              private store: Store<fromRoot.State>,
              private tourService: TourService,  // resume tours from anywhere
              private zone: NgZone) {
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
      this.store.dispatch(new routerActions.Go({
        path: [path],
        query: queryParams,
        extras: {replaceUrl: false}
      }));
    });
  }
}
