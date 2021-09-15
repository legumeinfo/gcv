export const formControlConfigFactory = (members, values, validators) => {
  const reducer = (accumulator, key) => {
      const value = (key in values) ? values[key] : '';
      const control = [value];
      if (key in validators) {
        control.push(validators[key]);
      }
      accumulator[key] = control;
      return accumulator;
    };
  return members.reduce(reducer, {});
};


export const parseParams =
(params: {[key: string]: any}, paramParsers: {[key: string]: Function}):
{[key: string]: any} => {
  const reducer = (accumulator, [key, value]) => {
      if (key in paramParsers) {
        accumulator[key] = paramParsers[key](value);
      }
      return accumulator;
    };
  return Object.entries(params).reduce(reducer, {});
};
