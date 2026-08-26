import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { provideMockStore, MockStore } from '@ngrx/store/testing';

import { MicroTracksService } from './micro-tracks.service';
import { AppConfig } from '@gcv/core/models';
import * as fromMicroTracks from '@gcv/gene/store/selectors/micro-tracks/';

// selectClusterIDs now delegates to the selectClusterIDs selector (change C
// removed the service-level `.pipe(map(...))`). Driving the leaf selector it is
// composed from (getClusteredSelectedMicroTracks) via MockStore proves the
// derived output is unchanged.

describe('MicroTracksService (avoid-mapping selector)', () => {
  let service: MicroTracksService;
  let store: MockStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MicroTracksService,
        provideMockStore(),
        { provide: AppConfig, useValue: AppConfig.instance },
        { provide: HttpClient, useValue: {} },
      ],
    });
    store = TestBed.inject(MockStore);
    store.overrideSelector(fromMicroTracks.getClusteredSelectedMicroTracks, []);
    store.refreshState();
    service = TestBed.inject(MicroTracksService);
  });

  it('selectClusterIDs returns the unique cluster IDs in order', (done) => {
    store.overrideSelector(fromMicroTracks.getClusteredSelectedMicroTracks, [
      { cluster: 0 },
      { cluster: 1 },
      { cluster: 0 },
    ] as any);
    store.refreshState();
    service.selectClusterIDs().subscribe((ids) => {
      expect(ids).toEqual([0, 1]);
      done();
    });
  });

  it('selectClusterIDs returns an empty list when there are no tracks', (done) => {
    store.overrideSelector(
      fromMicroTracks.getClusteredSelectedMicroTracks,
      [] as any,
    );
    store.refreshState();
    service.selectClusterIDs().subscribe((ids) => {
      expect(ids).toEqual([]);
      done();
    });
  });
});
