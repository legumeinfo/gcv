import { TestBed } from '@angular/core/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { Observable, of } from 'rxjs';

import { ProcessService } from './process.service';
import { ProcessStatus, ProcessStatusStream } from '@gcv/gene/models';
import * as fromGenes from '@gcv/gene/store/selectors/gene';
import * as fromChromosome from '@gcv/gene/store/selectors/chromosome';
import * as fromMicroTracks from '@gcv/gene/store/selectors/micro-tracks';
import * as fromPairwiseBlocks from '@gcv/gene/store/selectors/pairwise-blocks';

// Characterization tests for the reactive plumbing that change C refactors
// (combineLatest(store.select(a), store.select(b), …) → store.select(composed)).
// We drive the LEAF/input selectors via MockStore.overrideSelector, so whether a
// method reads those selectors directly (pre-refactor) or through a composed
// selector built on them (post-refactor), it derives the same value — making the
// characterization invariant to the refactor. Assertions are on the settled
// status word (insensitive to the benign combineLatest-vs-selector glitch
// difference, sensitive to any logic change).

describe('ProcessService (reactive plumbing)', () => {
  let service: ProcessService;
  let store: MockStore;

  const words = (stream: Observable<ProcessStatus>): string[] => {
    const collected: string[] = [];
    stream.subscribe((s) => collected.push(s.word)).unsubscribe();
    return collected;
  };
  const settled = (stream: Observable<ProcessStatus>): string => {
    const w = words(stream);
    return w[w.length - 1];
  };
  const priv = (
    method: string,
    ...args: unknown[]
  ): Observable<ProcessStatus> =>
    (service as unknown as Record<string, (...a: unknown[]) => unknown>)[
      method
    ](...args) as Observable<ProcessStatus>;
  const set = (selector: any, value: unknown) => {
    store.overrideSelector(selector, value);
    store.refreshState();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProcessService, provideMockStore()],
    });
    store = TestBed.inject(MockStore);
    service = TestBed.inject(ProcessService);

    // default (empty) values for every leaf selector the composed selectors read
    store.overrideSelector(fromGenes.getLoading, []);
    store.overrideSelector(fromGenes.getLoaded, []);
    store.overrideSelector(fromGenes.getFailed, []);
    store.overrideSelector(fromGenes.getSelectedGenesLoaded, false);
    store.overrideSelector(fromChromosome.getLoading, []);
    store.overrideSelector(fromChromosome.getLoaded, []);
    store.overrideSelector(fromChromosome.getFailed, []);
    store.overrideSelector(fromChromosome.getSelectedChromosomesLoaded, false);
    store.overrideSelector(fromMicroTracks.getLoading, []);
    store.overrideSelector(fromMicroTracks.getLoaded, []);
    store.overrideSelector(fromMicroTracks.getFailed, []);
    store.overrideSelector(fromMicroTracks.getSelectedMicroTracks, []);
    store.overrideSelector(fromMicroTracks.getActiveSearchMicroTracks, []);
    store.overrideSelector(fromMicroTracks.getClusteredSelectedMicroTracks, []);
    store.overrideSelector(
      fromMicroTracks.getClusteredAndAlignedSelectedMicroTracks,
      { consensuses: [], tracks: [] },
    );
    store.overrideSelector(
      fromMicroTracks.getClusteredAndAlignedSearchMicroTracks,
      [],
    );
    store.overrideSelector(fromPairwiseBlocks.getLoading, []);
    store.overrideSelector(fromPairwiseBlocks.getLoaded, []);
    store.overrideSelector(fromPairwiseBlocks.getFailed, []);
    store.overrideSelector(fromPairwiseBlocks.getPairwiseBlocks, []);
    store.refreshState();
  });

  describe('_getQueryGeneSubprocess (gene load-state)', () => {
    const id = { name: 'g1', source: 'lis' };

    it('is running while the gene is loading', () => {
      set(fromGenes.getLoading, [id]);
      expect(settled(priv('_getQueryGeneSubprocess', id))).toBe(
        'process-running',
      );
    });

    it('is success once the gene is loaded', () => {
      set(fromGenes.getLoaded, [id]);
      expect(settled(priv('_getQueryGeneSubprocess', id))).toBe(
        'process-success',
      );
    });

    it('is error when the gene failed', () => {
      set(fromGenes.getFailed, [id]);
      expect(settled(priv('_getQueryGeneSubprocess', id))).toBe(
        'process-error',
      );
    });

    it('is warning when the gene has no load state', () => {
      expect(settled(priv('_getQueryGeneSubprocess', id))).toBe(
        'process-warning',
      );
    });
  });

  describe('_getQueryTrackSubprocess (chromosome load-state)', () => {
    const id = { name: 'Gm09', source: 'lis' };

    it('is running while the chromosome is loading', () => {
      set(fromChromosome.getLoading, [id]);
      expect(settled(priv('_getQueryTrackSubprocess', id))).toBe(
        'process-running',
      );
    });

    it('is success once the chromosome is loaded', () => {
      set(fromChromosome.getLoaded, [id]);
      expect(settled(priv('_getQueryTrackSubprocess', id))).toBe(
        'process-success',
      );
    });

    it('is error when the chromosome failed', () => {
      set(fromChromosome.getFailed, [id]);
      expect(settled(priv('_getQueryTrackSubprocess', id))).toBe(
        'process-error',
      );
    });

    it('is warning when the chromosome has no load state', () => {
      expect(settled(priv('_getQueryTrackSubprocess', id))).toBe(
        'process-warning',
      );
    });
  });

  describe('_getTrackGeneSubprocess (5-source + gene helper)', () => {
    const source = 'lis';
    const track = { cluster: 0, source, genes: ['g1', 'g2'] };
    const g1 = { name: 'g1', source };
    const g2 = { name: 'g2', source };
    const call = () => priv('_getTrackGeneSubprocess', 0, source);

    beforeEach(() => set(fromMicroTracks.getSelectedMicroTracks, [track]));

    it('is running while a cluster gene is loading', () => {
      set(fromGenes.getLoading, [g1]);
      expect(settled(call())).toBe('process-running');
    });

    it('is success when all cluster genes are loaded', () => {
      set(fromGenes.getLoaded, [g1, g2]);
      expect(settled(call())).toBe('process-success');
    });

    it('is error when all cluster genes failed', () => {
      set(fromGenes.getFailed, [g1, g2]);
      expect(settled(call())).toBe('process-error');
    });

    it('is warning when only some cluster genes are loaded', () => {
      set(fromGenes.getLoaded, [g1]);
      expect(settled(call())).toBe('process-warning');
    });
  });

  describe('_getQueryAlignmentProcessStatus', () => {
    it('waits until genes and chromosomes are loaded', () => {
      set(fromGenes.getSelectedGenesLoaded, false);
      expect(settled(priv('_getQueryAlignmentProcessStatus'))).toBe(
        'process-waiting',
      );
    });

    it('is success once genes and chromosomes are loaded', () => {
      set(fromGenes.getSelectedGenesLoaded, true);
      set(fromChromosome.getSelectedChromosomesLoaded, true);
      expect(settled(priv('_getQueryAlignmentProcessStatus'))).toBe(
        'process-success',
      );
    });
  });

  describe('_getClusteringProcessStatus', () => {
    it('waits until selected genes and chromosomes are loaded', () => {
      set(fromGenes.getSelectedGenesLoaded, false);
      set(fromChromosome.getSelectedChromosomesLoaded, false);
      expect(settled(priv('_getClusteringProcessStatus'))).toBe(
        'process-waiting',
      );
    });

    it('reports success when tracks group into fewer clusters', () => {
      set(fromGenes.getSelectedGenesLoaded, true);
      set(fromChromosome.getSelectedChromosomesLoaded, true);
      set(fromMicroTracks.getClusteredSelectedMicroTracks, [
        { cluster: 0 },
        { cluster: 0 },
      ]);
      expect(settled(priv('_getClusteringProcessStatus'))).toBe(
        'process-success',
      );
    });

    it('reports info when every track has its own cluster', () => {
      set(fromGenes.getSelectedGenesLoaded, true);
      set(fromChromosome.getSelectedChromosomesLoaded, true);
      set(fromMicroTracks.getClusteredSelectedMicroTracks, [
        { cluster: 0 },
        { cluster: 1 },
      ]);
      expect(settled(priv('_getClusteringProcessStatus'))).toBe('process-info');
    });
  });

  // Note: _getMacroBlockPositionSubprocess reads the parameterized selector
  // getChromosomesForIDs(chromosomes), which can't be driven via MockStore's
  // overrideSelector (its identity varies per call). That site is covered by the
  // build and the macro-synteny Playwright tests rather than a unit test here.

  describe('_getQueryGeneProcessStatus (aggregates subprocess streams)', () => {
    const status = (word: string): ProcessStatusStream =>
      of({ word, description: word } as ProcessStatus);
    const aggregate = (...ws: string[]): string =>
      settled(priv('_getQueryGeneProcessStatus', of(...ws.map(status))));

    it('is running if any subprocess is running', () => {
      expect(aggregate('process-running', 'process-success')).toBe(
        'process-running',
      );
    });

    it('is success only if every subprocess succeeded', () => {
      expect(aggregate('process-success', 'process-success')).toBe(
        'process-success',
      );
    });

    it('is error only if every subprocess failed', () => {
      expect(aggregate('process-error', 'process-error')).toBe('process-error');
    });

    it('is warning on a mix of success and error', () => {
      expect(aggregate('process-success', 'process-error')).toBe(
        'process-warning',
      );
    });
  });
});
