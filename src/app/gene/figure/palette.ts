// The figure's colors. A color in a figure is a claim of homology, so each
// colored family gets its own, and every pair must stay distinguishable for
// readers with the common color-vision deficiencies. Okabe and Ito's
// palette does, with the neutral grey and white beside it: the smallest
// CIEDE2000 difference of any pair, with normal vision or simulated
// protanopia, deuteranopia or tritanopia, is about 10.9 (palette.spec.ts
// checks it). Patterns over them (below) give 21 families an encoding each.

// Okabe and Ito, "Color Universal Design" (2002), without black
export const PALETTE = [
  '#E69F00', // orange
  '#56B4E9', // sky blue
  '#009E73', // bluish green
  '#F0E442', // yellow
  '#0072B2', // blue
  '#D55E00', // vermillion
  '#CC79A7', // reddish purple
];

// a family with other genes in the figure that isn't colored
export const NEUTRAL = '#BBBBBB';

// a family with no other gene in the figure, or a gene without a family
export const HOLLOW = '#FFFFFF';

// Past seven families, a color repeats with a pattern over it, so each
// family keeps an encoding of its own that doesn't rest on hue alone (WCAG
// 1.4.1): solid, then striped, then dotted, for 21 in all.
export type FigurePatternKind = 'stripes' | 'dots';
export type FigureEncoding = {
  fill: string;
  pattern?: { kind: FigurePatternKind; ink: string };
};

// a pattern's ink: white on the dark colors, the glyphs' outline grey on the
// light ones, whichever contrasts more with the color under it
export const PATTERN_INKS = ['#FFFFFF', '#4D4D4D'];

// WCAG's relative luminance and contrast ratio
export function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const inkOn = (fill: string) =>
  [...PATTERN_INKS].sort((a, b) => contrast(b, fill) - contrast(a, fill))[0];

export const ENCODINGS: FigureEncoding[] = [
  undefined,
  'stripes' as const,
  'dots' as const,
].flatMap((kind) =>
  PALETTE.map((fill) =>
    kind === undefined
      ? { fill }
      : { fill, pattern: { kind, ink: inkOn(fill) } },
  ),
);
