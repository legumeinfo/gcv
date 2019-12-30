import { geneMap, macroBlocks, trackToInterval } from '@gcv/gene/models/shims';


// convert pairwise block and gene data into a visualization friendly format
export function macroShim(chromosome, query, tracks, pairwiseBlocks, genes) {
  const genesMap = geneMap(genes);
  // generate data
  const data = macroBlocks(chromosome, pairwiseBlocks, genesMap);
  // generate viewport
  const viewport = trackToInterval(query, genesMap);
  // generate highlight
  const highlight = tracks.map((t) => t.name);
  return {data, viewport, highlight};
}
