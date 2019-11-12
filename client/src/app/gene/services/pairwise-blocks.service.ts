// Angular
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
// store
import { Store } from '@ngrx/store';
import * as routerActions from '@gcv/core/store/actions/router.actions';
import * as fromRoot from '@gcv/gene/store/reducers';
// app
import { BlockParams, PairwiseBlocks, Track } from '@gcv/gene/models';
import { HttpService } from '@gcv/core/services/http.service';


@Injectable()
export class PairwiseBlocksService extends HttpService {

  constructor(private _http: HttpClient, private _store: Store<fromRoot.State>) {
    super(_http);
  }

  getPairwiseBlocks(
    chromosome: Track,
    blockParams: BlockParams,
    serverID: string,
    targets: string[] = [],
  ): Observable<PairwiseBlocks[]> {
    const body = {
      families: chromosome.families,
      intermediate: blockParams.bintermediate,
      mask: blockParams.bmask,
      matched: blockParams.bmatched,
      targets,
    };
    return this._makeRequest<{blocks: PairwiseBlocks[]}>(serverID, 'macro', body).pipe(
      map((result) => {
        const blocks = result.blocks;
        blocks.forEach((pair) => {
          pair.referenceSource = chromosome.source;
          pair.chromosomeSource = serverID;
        });
        return blocks;
      }),
      catchError((error) => throwError(error)),
    );
  }

  updateParams(params: BlockParams): void {
    const path = [];
    const query = Object.assign({}, params);
    this._store.dispatch(new routerActions.Go({path, query}));
  }
}
