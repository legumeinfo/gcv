// app
import { AppConfig, OrganismPlaceholders } from '@gcv/core/models';
import { PairSet, placeholderReplace } from '@gcv/core/utils'


function trackToFormattedName(track) {
  let name = AppConfig.macroLegend.format;
  const placeholders = {};
  placeholders[OrganismPlaceholders.Genus] = track.genus;
  placeholders[OrganismPlaceholders.Species] = track.species;
  placeholders[OrganismPlaceholders.Chromosome] = track.name;
  return placeholderReplace(name, placeholders);
};


function tracksToUniqueIDsAndNames(tracks, idFunction) {
  const idsAndNames = tracks.map((t) => {
    const id = idFunction(t);
    const name = trackToFormattedName(t)
    return [id, name];
  });
  const idAndNameSet = new PairSet(idsAndNames);
  const uniqueIDsAndNames = Array.from(idAndNameSet);
  return uniqueIDsAndNames;
}


function chromosomeID(track) {
  return track.name;
}


function organismID(track) {
  return `${track.genus} ${track.species}`;
}


export function macroLegendShim(queries, tracks) {

  // get the name format to determine what the ID and selector should be
  const format = AppConfig.macroLegend.format;
  const isChromosome = format.includes(OrganismPlaceholders.Chromosome);

  // generate the IDs and names for the tracks
  const idFunction = isChromosome ? chromosomeID : organismID;
  const highlight =
    tracksToUniqueIDsAndNames(queries, idFunction).map(([id, name]) => id);
  const data =
    tracksToUniqueIDsAndNames(tracks, idFunction).map(([id, name]) => ({id, name}));

  // set the selector
  const selector = isChromosome ? 'chromosome' : 'organism';

  return {data, highlight, selector};
}
