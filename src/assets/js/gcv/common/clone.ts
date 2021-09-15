/**
 * Creates a deep copy of the given object.
 * @param {Object} - The object to be cloned.
 * @return {Object} - A deep copy of the provided object.
 */
export function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
