import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, of } from 'rxjs';

import { ProcessService } from './process.service';
import { ProcessStatus, ProcessStatusStream } from '@gcv/gene/models';
import * as fromGenes from '@gcv/gene/store/selectors/gene';
import * as fromChromosome from '@gcv/gene/store/selectors/chromosome';
import * as fromMicroTracks from '@gcv/gene/store/selectors/micro-tracks';
import * as fromPairwiseBlocks from '@gcv/gene/store/selectors/pairwise-blocks';

// Characterization tests for the reactive plumbing that change C refactors
// (combineLatest(store.select(a), store.select(b), …) → store.select(composed)).
// They pin the settled status a method derives from a coherent store state, so
// the refactor is proven behavior-preserving. All sources are BehaviorSubjects,
// so every emission lands synchronously on subscribe — we collect and assert
// the final (settled) status, which is insensitive to the benign difference in
// intermediate "glitch" emissions between combineLatest and a composed selector.

describe('ProcessService (reactive plumbing)', () => {
  let service: ProcessService;
  let subjects: Map<unknown, BehaviorSubject<unknown>>;
  // returned for any selector not explicitly seeded — covers the parameterized
  // factory selectors (e.g. getChromosomesForIDs(chromosomes)) whose identity
  // changes per call and so can't be keyed by reference.
  let fallback: BehaviorSubject<unknown>;

  const seed = (selector: unknown, value: unknown) => {
    subjects.set(selector, new BehaviorSubject<unknown>(value));
  };
  const set = (selector: unknown, value: unknown) =>
    subjects.get(selector)!.next(value);

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

  beforeEach(() => {
    subjects = new Map();
    fallback = new BehaviorSubject<unknown>([]);
    // gene load states
    seed(fromGenes.getLoading, []);
    seed(fromGenes.getLoaded, []);
    seed(fromGenes.getFailed, []);
    seed(fromGenes.getSelectedGenesLoaded, false);
    // chromosome load states
    seed(fromChromosome.getLoading, []);
    seed(fromChromosome.getLoaded, []);
    seed(fromChromosome.getFailed, []);
    seed(fromChromosome.getSelectedChromosomesLoaded, false);
    // micro-track sets
    seed(fromMicroTracks.getClusteredSelectedMicroTracks, []);
    seed(fromMicroTracks.getSelectedMicroTracks, []);
    seed(fromMicroTracks.getActiveSearchMicroTracks, []);
    seed(fromMicroTracks.getClusteredAndAlignedSelectedMicroTracks, {
      consensuses: [],
      tracks: [],
    });
    // pairwise blocks
    seed(fromPairwiseBlocks.getPairwiseBlocks, []);

    const store = {
      select: (selector: unknown): Observable<unknown> =>
        subjects.get(selector) ?? fallback,
    };
    TestBed.configureTestingModule({
      providers: [ProcessService, { provide: Store, useValue: store }],
    });
    service = TestBed.inject(ProcessService);
  });

  describe('_getQueryGeneSubprocess (gene load-state combineLatest)', () => {
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

  describe('_getQueryTrackSubprocess (chromosome load-state combineLatest)', () => {
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

  describe('_getTrackGeneSubprocess (5-source combineLatest + gene helper)', () => {
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

  describe('_getQueryAlignmentProcessStatus (genes/chromosomes/aligned combineLatest)', () => {
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

  describe('_getClusteringProcessStatus (genes/chromosomes/tracks combineLatest)', () => {
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

  describe('_getMacroBlockPositionSubprocess (parameterized + inner-mapped combineLatest)', () => {
    // Wiring smoke test: exercises the full 5-source combine, including the
    // parameterized getChromosomesForIDs (served by the fallback) and the
    // inner-mapped getPairwiseBlocks. Empty inputs derive no genes → the gene
    // helper vacuously reports success.
    it('flows through to a status from the combined sources', () => {
      expect(
        settled(priv('_getMacroBlockPositionSubprocess', [], 'lis', [])),
      ).toBe('process-success');
    });
  });

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
