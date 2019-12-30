import { referenceBlockMap, geneMap, macroBlocks, trackMap, trackToInterval }
  from '@gcv/gene/models/shims';


// convert pairwise block and gene data into a visualization friendly format
export function macroCircosShim(queries, chromosomes, pairwiseBlocks, genes) {
  const genesMap = geneMap(genes);
  // generate data
  const chromosomesMap = trackMap(chromosomes);
  const referenceMap = referenceBlockMap(pairwiseBlocks);
  const data = Object.keys(referenceMap).map((referenceID) => {
      const referenceTrack = chromosomesMap[referenceID];
      const referenceBlocks = referenceMap[referenceID];
      return macroBlocks(referenceTrack, referenceBlocks, genesMap);
    });
  // generate highlights
  const highlight = queries.map((track) => {
      const interval = trackToInterval(track, genesMap);
      return {
        chromosome: track.name,
        ...interval,
      };
    });
  return {data, highlight};
}
