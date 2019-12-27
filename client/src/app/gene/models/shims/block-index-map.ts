import { PairwiseBlocks } from '@gcv/gene/models';
import { nameSourceID } from './name-source-id';


export type BlockIndexMap = {[key: string]: number[]};


// bin block gene indexes by chromosome+source
export function blockIndexMap(pairwiseBlocks: PairwiseBlocks[]): BlockIndexMap {
  const reducer = (accumulator, chromosomeBlocks) => {
      const {reference, referenceSource, blocks} = chromosomeBlocks;
      const id = nameSourceID(reference, referenceSource);
      if (!(id in accumulator)) {
        accumulator[id] = [];
      }
      blocks.forEach((b) => accumulator[id].push(b.i, b.j));
      return accumulator;
    };
  const map = pairwiseBlocks.reduce(reducer, {});
  return map;
}
