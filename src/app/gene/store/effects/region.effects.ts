// Angular
import { Injectable } from '@angular/core';
// store
import { Effect, Actions, ofType } from '@ngrx/effects';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import * as regionActions from '@gcv/gene/store/actions/region.actions';
import * as routerActions from '@gcv/store/actions/router.actions';
// app
import { Region } from '@gcv/gene/models';
import { RegionService } from '@gcv/gene/services';

@Injectable()
export class RegionEffects {

  constructor(private actions$: Actions,
              private regionService: RegionService) { }

  // get region via the region service
  @Effect()
  getRegion$ = this.actions$.pipe(
    ofType(regionActions.GET),
    map((action: regionActions.Get) => action.payload),
    switchMap(({chromosome, start, stop, source}) => {
      return this.regionService.getRegion(chromosome, start, stop, source).pipe(
        // TODO: should the be a takeUntil to stop requests in flight?
        map((region) => {
          region.source = source;
          return new regionActions.GetSuccess({region});
        }),
        catchError((e) => of(new regionActions.GetFailure({chromosome, start, stop, source}))),
      );
    })
  );

  // loads a new gene view (search) when a region is successfully retrieved
  @Effect()
  regionSearch$ = this.actions$.pipe(
    ofType(regionActions.GET_SUCCESS),
    map((action: regionActions.GetSuccess) => action.payload),
    map(({region}) => {
      const matrixParams = {};
      matrixParams[region.source] = region.gene;
      const path = ['/gene', matrixParams];
      const query = {neighbors: region.neighbors};
      return new routerActions.Go({path, query});
    }),
  );

}
