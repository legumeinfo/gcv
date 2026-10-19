import { Params } from '@gcv/gene/models/params';
import { initialState } from '@gcv/gene/store/reducers/params.reducer';
import { AlignedTrack, GeneViewInputs, summarizeGeneView } from './view-state';

const params = { ...initialState, sources: ['lis'] } as Params;

const queryTrack = {
  name: 'Gm01',
  genus: 'Glycine',
  species: 'max',
  source: 'lis',
  cluster: 0,
  genes: ['g1', 'g2', 'g3'],
  families: ['a', 'b', 'c'],
} as AlignedTrack;

const resultTrack = {
  ...queryTrack,
  name: 'Pv01',
  genes: ['p1', 'p2', 'p3'],
} as AlignedTrack;

function inputs(overrides: Partial<GeneViewInputs> = {}): GeneViewInputs {
  return {
    selectedGeneIDs: [{ name: 'g2', source: 'lis' }],
    geneLoadStates: [[], [{ name: 'g2', source: 'lis' }], []],
    chromosomeIDs: [{ name: 'Gm01', source: 'lis' }],
    chromosomeLoadStates: [[], [{ name: 'Gm01', source: 'lis' }], []],
    query: { consensuses: [['a', 'b', 'c']], tracks: [queryTrack] },
    tracks: [queryTrack, resultTrack, resultTrack],
    microTrackLoadStates: [[], [{ cluster: 0, source: 'lis' }], []],
    params,
    ...overrides,
  };
}

describe('summarizeGeneView', () => {
  it('is empty and settled without query genes', () => {
    const summary = summarizeGeneView(
      inputs({ selectedGeneIDs: [], query: { consensuses: [], tracks: [] } }),
    );
    expect(summary).toMatchObject({ status: 'empty', settled: true });
  });

  it('is loading while a query gene is pending', () => {
    const summary = summarizeGeneView(
      inputs({
        geneLoadStates: [[], [], []],
        query: { consensuses: [], tracks: [] },
      }),
    );
    expect(summary).toMatchObject({ status: 'loading', settled: false });
    expect(summary.queryGenes[0].status).toBe('pending');
  });

  it('is loading while a search has not finished', () => {
    const summary = summarizeGeneView(
      inputs({ microTrackLoadStates: [[], [], []] }),
    );
    expect(summary).toMatchObject({ status: 'loading', settled: false });
    expect(summary.clusters[0].searches).toEqual({ lis: 'pending' });
  });

  it('is ready once every search has finished', () => {
    const summary = summarizeGeneView(inputs());
    expect(summary).toMatchObject({ status: 'ready', settled: true });
    expect(summary.clusters).toEqual([
      {
        cluster: 0,
        consensusLength: 3,
        queryTracks: [
          {
            source: 'lis',
            genus: 'Glycine',
            species: 'max',
            chromosome: 'Gm01',
            firstGene: 'g1',
            lastGene: 'g3',
            genes: 3,
          },
        ],
        searches: { lis: 'loaded' },
        resultTracks: 1,
        resultAlignments: 2,
      },
    ]);
  });

  it('is partial when a search failed', () => {
    const summary = summarizeGeneView(
      inputs({
        microTrackLoadStates: [[], [], [{ cluster: 0, source: 'lis' }]],
      }),
    );
    expect(summary).toMatchObject({ status: 'partial', settled: true });
    expect(summary.issues).toEqual(['The lis search for cluster 0 failed']);
  });

  it('is an error when every query gene failed', () => {
    const summary = summarizeGeneView(
      inputs({
        geneLoadStates: [[], [], [{ name: 'g2', source: 'lis' }]],
        chromosomeIDs: [],
        query: { consensuses: [], tracks: [] },
        tracks: [],
      }),
    );
    expect(summary).toMatchObject({ status: 'error', settled: true });
    expect(summary.issues).toEqual([
      'Query gene g2 could not be loaded from lis',
    ]);
  });
});
