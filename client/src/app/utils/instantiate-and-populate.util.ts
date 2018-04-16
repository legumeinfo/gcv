// creates a new instance of the given type T and updates its attributes with
// those shared with the given object obj
export function instantiateAndPopulate<T>(type: {new():T;}, obj: any): T {
  const t = new type();
  Object.keys(t).forEach(function(key, index) {
    if (obj.hasOwnProperty(key)) {
      t[key] = obj[key];
    }
  });
  return t;
}
