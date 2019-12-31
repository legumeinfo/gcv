import { Track } from '@gcv/gene/models';


// filters track genes/families to only contain indexes from the block map
export function endpointGenes(track: Track, indexes: number[] = []): Track {
  const genes = [];
  const families = [];
  indexes.forEach((i) => {
    genes.push(track.genes[i]);
    families.push(track.families[i]);
  });
  return {
    ...track,
    genes,
    families,
  };
}
