function tracksToUniqueOrganismIDs(tracks) {
  const idList = tracks.map((t) => `${t.genus} ${t.species}`);
  const idSet = new Set(idList);
  const uniqueIDlist = Array.from(idSet);
  return uniqueIDlist;
}

export function macroLegendShim(queries, tracks) {
  const highlight = tracksToUniqueOrganismIDs(queries);
  const data = tracksToUniqueOrganismIDs(tracks).map((id) => ({id, name: id}));
  return {data, highlight};
}
