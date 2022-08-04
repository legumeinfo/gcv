import { AppConfig, OrganismPlaceholders } from '@gcv/core/models';
import { geneMap, macroBlocks, trackToInterval } from '@gcv/gene/models/shims';


function chromosomeID(track) {
  return track.chromosome;
}


function organismID(track) {
  return `${track.genus} ${track.species}`;
}


// convert pairwise block and gene data into a visualization friendly format
export function macroShim(chromosome, query, tracks, pairwiseBlocks, genes) {
  const genesMap = geneMap(genes);
  // generate data
  const format = AppConfig.macroLegend.format;
  const idFunction = format.includes(OrganismPlaceholders.Chromosome) ? chromosomeID : organismID;
  const data = macroBlocks(chromosome, pairwiseBlocks, genesMap);
  data.tracks = data.tracks
    .map((track) => {
      return {
        ...track,
        id: idFunction(track),
      };
    });
  // generate viewport
  const viewport = trackToInterval(query, genesMap);
  // generate highlight
  const highlight = tracks.map((t) => t.name);
  return {data, viewport, highlight};
}
