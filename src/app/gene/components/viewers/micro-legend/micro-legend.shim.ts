// convert track and gene data into a visualization friendly format
export function microLegendShim(tracks) {
  const reducer = (accumulator, track) => {
      track.families.forEach((f, i) => {
        if (!(f in accumulator)) {
          accumulator[f] = [];
        }
        const g = track.genes[i];
        accumulator[f].push(g);
      });
      return accumulator;
    };
  const familyMembers = tracks.reduce(reducer, {});
  const orphans = {name: 'Orphans', id: '', genes: []};
  if ('' in familyMembers) {
    orphans.genes = familyMembers[''];
    delete familyMembers[''];
  }
  const singletonIDs =
    Object.keys(familyMembers).filter((f) => familyMembers[f].length == 1);
  const singletons = {
      name: 'Singletons',
      id: ['singleton'].concat(singletonIDs).join(','),
      genes: singletonIDs.map((f) => familyMembers[f]),
    };
  const many =
    Object.keys(familyMembers).filter((f) => familyMembers[f].length > 1);
  const data = many.map((f: string) => {
      return {name: f, id: f, genes: familyMembers[f]};
    });
  return {data, singletons, orphans};
}
