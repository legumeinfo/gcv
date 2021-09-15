import { arrayFlatten } from '@gcv/core/utils';
import { Track } from '@gcv/gene/models';
import { GeneMap } from '@gcv/gene/models/shims';


export function trackToInterval(track: Track, genesMap: GeneMap) {
  const geneLoci = track.genes
      .filter((name) => name in genesMap)
      .map((name) => {
        const gene = genesMap[name];
        return [gene.fmin, gene.fmax];
      });
  const geneLociPoints = arrayFlatten(geneLoci);
  const interval = {start: 0, stop: 0};
  if (geneLociPoints.length > 0) {
    interval.start = Math.min(...geneLociPoints);
    interval.stop = Math.max(...geneLociPoints);
  }
  return interval;
}
