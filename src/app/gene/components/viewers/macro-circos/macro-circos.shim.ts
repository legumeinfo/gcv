import { AppConfig, OrganismPlaceholders } from '@gcv/core/models';
import { referenceBlockMap, geneMap, macroBlocks, nameSourceID, trackMap,
  trackToInterval } from '@gcv/gene/models/shims';


function chromosomeID(track) {
  return track.chromosome;
}


function organismID(track) {
  return `${track.genus} ${track.species}`;
}


// convert pairwise block and gene data into a visualization friendly format
export function macroCircosShim(queries, chromosomes, pairwiseBlocks, genes) {
  const genesMap = geneMap(genes);
  // generate data
  const format = AppConfig.macroLegend.format;
  const idFunction = format.includes(OrganismPlaceholders.Chromosome) ? chromosomeID : organismID;
  const chromosomesMap = trackMap(chromosomes);
  const referenceMap = referenceBlockMap(pairwiseBlocks);
  const data = Object.keys(chromosomesMap).map((referenceID) => {
      const referenceTrack = chromosomesMap[referenceID];
      const referenceBlocks = (referenceID in referenceMap) ?
        referenceMap[referenceID] :
        [];
      const chromosomeTracks = macroBlocks(referenceTrack, referenceBlocks, genesMap);
      return {
        ...chromosomeTracks,
        id: idFunction(chromosomeTracks),
      };
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
