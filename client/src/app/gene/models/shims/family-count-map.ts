export type FamilyCountMap = {[key: string]: number};


export function familyCountMap(families: string[]): FamilyCountMap {
  const reducer = (accumulator, family) => {
      if (!(family in accumulator)) {
        accumulator[family] = 0;
      }
      accumulator[family] += 1;
      return accumulator;
    };
  const map = families.reduce(reducer, {});
  return map;
}
