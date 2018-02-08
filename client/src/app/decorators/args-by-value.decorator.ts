export function argsByValue() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    descriptor.value = function(...args: any[]) {
      args = args.map(a => JSON.parse(JSON.stringify(a)));
      const result = method.apply(this, args);
      return result;
    };
    return descriptor;
  }
}
