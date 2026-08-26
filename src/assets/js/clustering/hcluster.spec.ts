import hcluster from './hcluster';
import { levenshtein } from '../gcv/metrics/levenshtein';

// hcluster is the hierarchical clustering that groups micro-synteny tracks before
// alignment (clustered-and-aligned-micro-tracks.selector calls
// `clustering.hcluster(tracks, metric, linkage, cthreshold)`). With a threshold it
// returns a forest of dendrogram nodes; the selector walks each node with the same
// recurrence used below to recover the tracks in every cluster. The invariants
// that matter to GCV are: every input lands in exactly one cluster (no track is
// lost or duplicated), and the cthreshold actually separates dissimilar tracks
// from similar ones. A regression here silently mis-groups tracks — the viewer
// still renders, but against the wrong consensus.

// Recover the leaf values of a dendrogram node, mirroring the selector's walk.
const leaves = (node: any): any[] =>
  'left' in node && 'right' in node
    ? [...leaves(node.left), ...leaves(node.right)]
    : [node.value];

const clusterLeafSets = (clusters: any[]): any[][] =>
  clusters.map((c) => leaves(c).sort());

const distance = (a: number, b: number): number => Math.abs(a - b);

describe('hcluster', () => {
  // [1,2] are close, [20,21] are close, and the two groups are far apart.
  const points = [1, 2, 20, 21];

  it('partitions the input: every item appears in exactly one cluster', () => {
    const clusters = hcluster(points, distance, 'average', 10);
    const recovered = clusterLeafSets(clusters)
      .flat()
      .sort((a, b) => a - b);
    expect(recovered).toEqual([...points].sort((a, b) => a - b));
  });

  it('separates two well-separated groups at an intermediate threshold', () => {
    const clusters = hcluster(points, distance, 'average', 10);
    const sets = clusterLeafSets(clusters);
    expect(clusters.length).toBe(2);
    expect(sets).toContainEqual([1, 2]);
    expect(sets).toContainEqual([20, 21]);
  });

  it('leaves every item its own cluster when the threshold is below all distances', () => {
    // smallest pairwise distance is 1, so a threshold of 0.5 blocks all merges
    const clusters = hcluster(points, distance, 'average', 0.5);
    expect(clusters.length).toBe(points.length);
    clusters.forEach((c) => expect(leaves(c).length).toBe(1));
  });

  it('merges everything into one cluster when the threshold exceeds all distances', () => {
    const clusters = hcluster(points, distance, 'average', 1000);
    expect(clusters.length).toBe(1);
    expect(leaves(clusters[0]).sort((a, b) => a - b)).toEqual([1, 2, 20, 21]);
  });

  it('returns a single dendrogram spanning all items when no threshold is given', () => {
    const root = hcluster(points, distance, 'average');
    expect(leaves(root).sort((a, b) => a - b)).toEqual([1, 2, 20, 21]);
  });

  it('groups tracks by family similarity using the levenshtein metric (real use)', () => {
    // two tracks with identical family content and one divergent track
    const trackA = { families: ['fam1', 'fam2', 'fam3'] };
    const trackB = { families: ['fam1', 'fam2', 'fam3'] };
    const trackC = { families: ['famX', 'famY', 'famZ'] };
    const metric = (t1: any, t2: any) => levenshtein(t1.families, t2.families);

    // threshold 1: identical tracks (distance 0) merge, divergent (distance 3) stays out
    const clusters = hcluster([trackA, trackB, trackC], metric, 'average', 1);
    const sets = clusters.map((c) => leaves(c));
    expect(clusters.length).toBe(2);
    // the divergent track is alone
    expect(sets).toContainEqual([trackC]);
    // the identical pair clustered together
    const pair = sets.find((s) => s.length === 2);
    expect(pair).toEqual(expect.arrayContaining([trackA, trackB]));
  });
});
