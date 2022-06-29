// convert track and gene data into a visualization friendly format
export function microLegendShim(tracks) {
  const reducer = (accumulator, track) => {
      track.families.forEach((f) => {
        if (f != '') {
          if (!(f in accumulator)) {
            accumulator[f] = 0;
          }
          accumulator[f] += 1;
        }
      });
      return accumulator;
    };
  const familySizes = tracks.reduce(reducer, {});
  const singletonIDs =
    Object.keys(familySizes).filter((f) => familySizes[f] == 1);
  const singletons = {
      name: 'Singletons',
      id: ['singleton'].concat(singletonIDs).join(','),
    };
  const many = Object.keys(familySizes).filter((f) => familySizes[f] > 1);
  const data = many.map((f: string) => ({name: f, id: f}));
  return {data, singletons};
}
