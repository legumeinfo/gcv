export const pick = (props, o, pickUndefined=false) => {
  const reducer = (accumulator, prop) => {
      if (prop in o || pickUndefined) {
        accumulator[prop] = o[prop];
      }
      return accumulator;
    };
  return props.reduce(reducer, {});
}
