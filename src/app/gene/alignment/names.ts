// Finds a gene among the view's genes by the name a person or an agent gives.
// Names often drop the assembly prefix ('Glyma.12G040000' for
// 'glyma.Wm82.gnm4.ann1.Glyma.12G040000'), so a name also matches as the
// suffix of a full name.

// whether the name is the full name, or its suffix after a dot
export const matchesName = (full: string, name: string): boolean => {
  const f = full.toLowerCase();
  const n = name.toLowerCase();
  return f === n || f.endsWith(`.${n}`);
};

// the name itself if present, otherwise every name it is the suffix of
export function matchGeneName(names: Iterable<string>, gene: string): string[] {
  const all = Array.from(new Set(names));
  if (all.includes(gene)) {
    return [gene];
  }
  return all.filter((n) => matchesName(n, gene));
}
