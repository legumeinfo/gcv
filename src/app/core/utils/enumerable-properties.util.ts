export const enumerableProperties = (o: object): string[] => {
  const props = [];
  for (const p in o) {
    props.push(p);
  }
  return props;
};
