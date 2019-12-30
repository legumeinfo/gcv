import { Track } from '@gcv/gene/models';
import { BlockIndexMap } from './block-index-map';
import { nameSourceID } from './name-source-id';


// filters track genes/families to only contain indexes from the block map
export function
endpointGenesShim(track: Track, chromosomeGeneIndexes: BlockIndexMap):
Track {
  const id = nameSourceID(track.name, track.source);
  const genes = [];
  const families = [];
  if (id in chromosomeGeneIndexes) {
    chromosomeGeneIndexes[id].forEach((i) => {
      genes.push(track.genes[i]);
      families.push(track.families[i]);
    });
  }
  return {
    ...track,
    genes,
    families,
  };
}
