// The cluster a figure shows, named by a query gene, since cluster numbers
// change when the clustering parameters do.
import { AlignedTrack, matchGeneName } from '@gcv/gene/alignment';

// the cluster whose query tracks hold the gene, or the view's only cluster
// when the figure names none; null when that isn't one cluster
export function figureCluster(
  gene: string | undefined,
  queryTracks: AlignedTrack[],
): number | null {
  const holders =
    gene === undefined
      ? queryTracks
      : queryTracks.filter((t) => matchGeneName(t.genes, gene).length > 0);
  const clusters = Array.from(new Set(holders.map((t) => t.cluster)));
  return clusters.length === 1 ? clusters[0] : null;
}
