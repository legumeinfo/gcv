import { microShim } from './micro.shim';

function track(name: string, cluster: number) {
  const genes = [`${name}.g1`, `${name}.g2`];
  return {
    name,
    cluster,
    genes,
    families: ['f1', 'f2'],
    alignment: [0, 1],
    orientations: [1, 1],
    segments: [0, 0],
    genus: 'Glycine',
    species: 'max',
    source: 'lis',
  };
}

describe('microShim', () => {
  // the view's tracks interleave clusters
  const tracks = [
    track('Gm01', 0),
    track('Gm02', 1),
    track('Gm03', 0),
    track('Gm04', 1),
  ];

  // The viewer reports a clicked track by its index in data; the gene view
  // opens that track's details and dot plots, so the index must name the
  // drawn track in every cluster, not only the first.
  it("returns the cluster's tracks indexed as the drawn tracks", () => {
    const { data, tracks: clusterTracks } = microShim(1, [], tracks, [], []);
    expect(clusterTracks.map((t) => t.name)).toEqual(['Gm02', 'Gm04']);
    data.forEach((drawn, i) => {
      expect(drawn.chromosome_name).toBe(clusterTracks[i].name);
      expect(drawn.genes.map((g) => g.name)).toEqual(clusterTracks[i].genes);
    });
  });
});
