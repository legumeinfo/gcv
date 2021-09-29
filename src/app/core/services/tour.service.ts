// Angular
import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
// store
import { filter } from 'rxjs/operators';
// app
import { AppConfig } from '@gcv/core/models';
import { ScriptService } from '@gcv/core/services';


@Injectable()
export class TourService {

  constructor(private _appConfig: AppConfig,
              private router: Router,
              private _scriptService: ScriptService) {
    const scriptRoot = 'config/tours/';
    router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        // ensure the tour is loaded and initialized after every route change so
        // the next step can be shown
        _appConfig.tours.map((t) => {
          _scriptService.loadScript(scriptRoot + t.script)
            .pipe(finalize(() => {
              if (window[t.name]._inited) {
                const i = window[t.name].getCurrentStep();
                window[t.name].showStep(i);
              } else {
                window[t.name].init();
              }
            }));
        });
      });
  }

  startTour(name: string): void {
    if (window.hasOwnProperty(name)) {
      window[name].end();
      window[name].restart();
    }
  }
}
