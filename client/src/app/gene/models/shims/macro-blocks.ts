import { nameSourceID } from './name-source-id';


function block(b, referenceTrack, genesMap) {
  const startGene = genesMap[referenceTrack.genes[b.i]];
  const stopGene = genesMap[referenceTrack.genes[b.j]];
  return {
    orientation: b.orientation,
    start: b.fmin,
    stop: b.fmax,
    query_start: startGene.fmin,
    query_stop: stopGene.fmax,
  };
}

function track(referenceTrack, chromosomeBlocks, genesMap) {
  const {chromosome, chromosomeGenus, chromosomeSpecies} = chromosomeBlocks;
  return {
    chromosome,
    genus: chromosomeGenus,
    species: chromosomeSpecies,
    blocks: chromosomeBlocks.blocks
      .filter((b) => {
        const start = referenceTrack.genes[b.i];
        const stop = referenceTrack.genes[b.j];
        return start in genesMap && stop in genesMap;
      })
      .map((b) => block(b, referenceTrack, genesMap)),
  };
}

export function macroBlocks(referenceTrack, referenceBlocks, genesMap) {
  const {name, length, genus, species, source} = referenceTrack;
  return {
    chromosome: name,
    length,
    genus,
    species,
    source,
    tracks: referenceBlocks.map((chromosomeBlocks) => {
      const {chromosome, chromosomeSource} = chromosomeBlocks;
      const chromosomeID = nameSourceID(chromosome, chromosomeSource);
      return track(referenceTrack, chromosomeBlocks, genesMap);
    }),
  };
}
