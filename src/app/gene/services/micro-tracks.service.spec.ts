import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, of } from 'rxjs';

import { MicroTracksService } from './micro-tracks.service';
import { AppConfig } from '@gcv/core/models';
import * as fromMicroTracks from '@gcv/gene/store/selectors/micro-tracks/';

// Pins the avoid-mapping-selectors site: selectClusterIDs derives the unique
// cluster IDs from a store selector via a `.pipe(map(...))`. Change C moves that
// mapping into a selector; this proves the derived output is unchanged.

describe('MicroTracksService (avoid-mapping selector)', () => {
  let service: MicroTracksService;
  let clustered$: BehaviorSubject<unknown>;

  beforeEach(() => {
    clustered$ = new BehaviorSubject<unknown>([]);
    const store = {
      select: (selector: unknown): Observable<unknown> =>
        selector === fromMicroTracks.getClusteredSelectedMicroTracks
          ? clustered$
          : of(undefined),
      dispatch: () => {},
    };
    TestBed.configureTestingModule({
      providers: [
        MicroTracksService,
        { provide: Store, useValue: store },
        { provide: AppConfig, useValue: AppConfig.instance },
        { provide: HttpClient, useValue: {} },
      ],
    });
    service = TestBed.inject(MicroTracksService);
  });

  it('selectClusterIDs returns the unique cluster IDs in order', (done) => {
    clustered$.next([{ cluster: 0 }, { cluster: 1 }, { cluster: 0 }]);
    service.selectClusterIDs().subscribe((ids) => {
      expect(ids).toEqual([0, 1]);
      done();
    });
  });

  it('selectClusterIDs returns an empty list when there are no tracks', (done) => {
    clustered$.next([]);
    service.selectClusterIDs().subscribe((ids) => {
      expect(ids).toEqual([]);
      done();
    });
  });
});
