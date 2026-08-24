import { PairwiseBlocks } from '@gcv/gene/models';
import { nameSourceID } from './name-source-id';

export type BlockIndexMap = { [key: string]: number[] };

// bin block gene indexes by reference chromosome+source
export function blockIndexMap(pairwiseBlocks: PairwiseBlocks[]): BlockIndexMap {
  const reducer = (accumulator, pairBlocks) => {
    const { reference, referenceSource, blocks } = pairBlocks;
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
