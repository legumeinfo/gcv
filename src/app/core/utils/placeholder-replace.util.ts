/**
 * Takes a string and an object that maps placeholders to values and replaces
 * every instance of the placeholders in the string with their values.
 * @param item
 * @returns {boolean}
 */
export function placeholderReplace(text: string, placeholders: Object) {
  let formatted = text;
  for (const p in placeholders) {
    const regexp = new RegExp('\\{'+ p +'\\}', 'gi');
    formatted = formatted.replace(regexp, placeholders[p]);
  }
  return formatted;
};
