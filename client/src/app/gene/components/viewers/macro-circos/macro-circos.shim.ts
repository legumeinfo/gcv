import { Track } from '@gcv/gene/models';
import { BlockIndexMap, blockReferenceMap, geneMap, nameSourceID, trackMap }
  from '@gcv/gene/models/shims';


// filters chromosome genes/families to only contain indexes from the block map
export function
endpointGenesShim(chromosome: Track, chromosomeGeneIndexes: BlockIndexMap):
Track {
  const id = nameSourceID(chromosome.name, chromosome.source);
  const genes = [];
  const families = [];
  if (id in chromosomeGeneIndexes) {
    chromosomeGeneIndexes[id].forEach((i) => {
      genes.push(chromosome.genes[i]);
      families.push(chromosome.families[i]);
    });
  }
  return {
    ...chromosome,
    genes,
    families,
  };
}


function trackToMacro(chromosome) {
  const {name, length, genus, species, source} = chromosome;
  return {
    chromosome: name,
    length,
    genus,
    species,
    source,
  };
}

function block(b, referenceTrack, genesMap) {
  const startGene = genesMap[referenceTrack.genes[b.i]];
  const stopGene = genesMap[referenceTrack.genes[b.j]];
  return {
    orientation: (b.orientation === '-') ? -1 : 1,
    start: b.fmin,
    stop: b.fmax,
    query_start: startGene.fmin,
    query_stop: stopGene.fmax,
  };
}

function track(referenceTrack, chromosomeTrack, chromosomeBlocks, genesMap) {
  const chromosome = trackToMacro(chromosomeTrack);
  return {
    ...chromosome,
    blocks: chromosomeBlocks.blocks
      .filter((b) => {
        const start = referenceTrack.genes[b.i];
        const stop = referenceTrack.genes[b.j];
        return start in genesMap && stop in genesMap;
      })
      .map((b) => block(b, referenceTrack, genesMap)),
  };
}

function macroEntry(referenceTrack, referenceBlocks, chromosomesMap, genesMap) {
  const reference = trackToMacro(referenceTrack);
  return {
    ...reference,
    tracks: referenceBlocks.map((chromosomeBlocks) => {
      const {chromosome, chromosomeSource} = chromosomeBlocks;
      const chromosomeID = nameSourceID(chromosome, chromosomeSource);
      const chromosomeTrack = chromosomesMap[chromosomeID];
      return track(referenceTrack, chromosomeTrack, chromosomeBlocks, genesMap);
    }),
  };
}


// convert pairwise block and gene data into a visualization friendly format
export function macroCircosShim(chromosomes, pairwiseBlocks, genes) {
  const chromosomesMap = trackMap(chromosomes);
  const referenceMap = blockReferenceMap(pairwiseBlocks);
  const genesMap = geneMap(genes);
  // convert data
  const data = Object.keys(referenceMap).map((referenceID) => {
      const referenceTrack = chromosomesMap[referenceID];
      const referenceBlocks = referenceMap[referenceID];
      return macroEntry(referenceTrack, referenceBlocks, chromosomesMap, genesMap);
    });
  return data;
}
