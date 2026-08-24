import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable } from 'rxjs';

import { PairwiseBlocksService } from './pairwise-blocks.service';
import { ScriptService } from '@gcv/core/services';
import { AppConfig } from '@gcv/core/models';

// Pins the avoid-mapping-selectors site: getPairwiseBlocksForTracks selects a
// (parameterized) selector, then filters the blocks by the requested targets in
// a `.pipe(map(...))`. Change C moves that filtering into a selector; this proves
// the derived output is unchanged. The parameterized selector's identity varies
// per call, so the mock store returns the same blocks subject for it.

describe('PairwiseBlocksService (avoid-mapping selector)', () => {
  let service: PairwiseBlocksService;
  let blocks$: BehaviorSubject<unknown>;

  beforeEach(() => {
    blocks$ = new BehaviorSubject<unknown>([]);
    const store = {
      select: (): Observable<unknown> => blocks$,
      dispatch: () => {},
    };
    TestBed.configureTestingModule({
      providers: [
        PairwiseBlocksService,
        { provide: Store, useValue: store },
        { provide: AppConfig, useValue: AppConfig.instance },
        { provide: ScriptService, useValue: {} },
        { provide: HttpClient, useValue: {} },
      ],
    });
    service = TestBed.inject(PairwiseBlocksService);
  });

  const blocks = [
    { chromosome: 'c1', reference: 'r', referenceSource: 's' },
    { chromosome: 'c2', reference: 'r', referenceSource: 's' },
  ];

  it('keeps only blocks on the requested target chromosomes', (done) => {
    blocks$.next(blocks);
    service
      .getPairwiseBlocksForTracks([], [], {} as any, ['c1'])
      .subscribe((result) => {
        expect(result.map((b) => b.chromosome)).toEqual(['c1']);
        done();
      });
  });

  it('returns all blocks when no targets are requested', (done) => {
    blocks$.next(blocks);
    service
      .getPairwiseBlocksForTracks([], [], {} as any, [])
      .subscribe((result) => {
        expect(result.map((b) => b.chromosome)).toEqual(['c1', 'c2']);
        done();
      });
  });
});
