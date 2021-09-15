import { PairwiseBlocks } from '@gcv/gene/models';
import { nameSourceID } from './name-source-id';


export type ReferenceBlockMap = {[key: string]: PairwiseBlocks[]};


// bin blocks by reference chromosome+source
export function referenceBlockMap(pairwiseBlocks: PairwiseBlocks[]):
ReferenceBlockMap {
  const reducer = (accumulator, pairBlocks) => {
      const {reference, referenceSource} = pairBlocks;
      const id = nameSourceID(reference, referenceSource);
      if (!(id in accumulator)) {
        accumulator[id] = [];
      }
      accumulator[id].push(pairBlocks);
      return accumulator;
    };
  const map = pairwiseBlocks.reduce(reducer, {});
  return map;
}
