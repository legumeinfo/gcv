/**
 * A help for assigning default values to an optional parameter object.
 * @param {object} options - The optional parameter object.
 * @param {string} option - The name of the option to set.
 * @param {any} value - The default value for the given option.
 */
export function setOption(options: object, option: string, value: any): void {
  if (options[option] === undefined ||
      typeof options[option] !== typeof value) {
    options[option] = value;
  }
}
