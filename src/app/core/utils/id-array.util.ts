export const idArrayLeftDifferenceFactory = (
  TactionID: (id: any) => string,
  Tid: (id: any) => string,
) => {
  // subtracts overlapping IDs from a1
  return (a1, a2, checkAction = false) => {
    const id2string = checkAction ? TactionID : Tid;
    const a2IDs = new Set(a2.map(id2string));
    return a1.filter((id) => !a2IDs.has(id2string(id)));
  };
};

export const idArrayIntersectionFactory = (
  TactionID: (id: any) => string,
  Tid: (id: any) => string,
) => {
  // computes the intersection of the two ID arrays
  return (a1, a2, checkAction = false) => {
    const id2string = checkAction ? TactionID : Tid;
    const a2IDs = new Set(a2.map(id2string));
    return a1.filter((id) => a2IDs.has(id2string(id)));
  };
};
