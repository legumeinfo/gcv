// Angular
import { Injectable } from "@angular/core";
import { PRIMARY_OUTLET, NavigationEnd, Router } from "@angular/router";
// store
import { distinctUntilChanged, filter } from "rxjs/operators";
// app
import { AppConfig } from "../app.config";

@Injectable()
export class TourService {

  constructor(private router: Router) {
    router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        distinctUntilChanged((a: any, b: any) => {
          const aPath = this.urlToPath(a.url);
          const bPath = this.urlToPath(b.url);
          return aPath === bPath;
        })
        )
      .subscribe((event) => {
        // ensure the tour is initialized after every route change so the next
        // step can be shown
        for (const name of AppConfig.TOURS) {
          if (window[name]._inited) {
            const i = window[name].getCurrentStep();
            window[name].showStep(i);
          } else {
            window[name].init();
          }
        }
      });
  }

  startTour(name: string): void {
    if (window.hasOwnProperty(name)) {
      window[name].end();
      window[name].restart();
    }
  }

  private urlToPath(url: string) {
    const tree = this.router.parseUrl(url);
    const path = tree.root.children[PRIMARY_OUTLET].toString();
    return path;
  }
}
