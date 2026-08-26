// Angular
import { Injectable, inject } from '@angular/core';
// store
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import * as regionActions from '@gcv/gene/store/actions/region.actions';
import * as routerActions from '@gcv/store/actions/router.actions';
// app
import { RegionService } from '@gcv/gene/services';

@Injectable()
export class RegionEffects {
  private actions$ = inject(Actions);
  private regionService = inject(RegionService);

  // get region via the region service
  getRegion$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(regionActions.get),
      map((action) => action.payload),
      switchMap(({ chromosome, start, stop, source }) => {
        return this.regionService
          .getRegion(chromosome, start, stop, source)
          .pipe(
            // TODO: should the be a takeUntil to stop requests in flight?
            map((region) => {
              region.source = source;
              return regionActions.getSuccess({ region });
            }),
            catchError((e) =>
              of(
                regionActions.getFailure({
                  chromosome,
                  start,
                  stop,
                  source,
                }),
              ),
            ),
          );
      }),
    );
  });

  // loads a new gene view (search) when a region is successfully retrieved
  regionSearch$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(regionActions.getSuccess),
      map((action) => action.payload),
      map(({ region }) => {
        const matrixParams = {};
        matrixParams[region.source] = region.gene;
        const path = ['/gene', matrixParams];
        const query = { neighbors: region.neighbors };
        return routerActions.go({ path, query });
      }),
    );
  });
}
