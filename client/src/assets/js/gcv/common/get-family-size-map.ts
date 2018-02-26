// return a family size map
export function getFamilySizeMap(groups) {
  // make a family size map
  const familySizes = {};
  for (const group of groups) {
    for (const gene of group.genes) {
      const family = gene.family;
      if (family in familySizes) {
        familySizes[family] += 1;
      } else {
        familySizes[family] = 1;
      }
    }
  }
  return familySizes;
}
