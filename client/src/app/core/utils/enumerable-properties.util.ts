export const enumerableProperties = (o: Object): string[] => {
  const props = [];
  for (let p in o) {
    props.push(p);
  }
  return props;
};
