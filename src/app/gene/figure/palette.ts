// The figure's colors. A color in a figure is a claim of homology, so each
// colored family gets its own, and every pair must stay distinguishable for
// readers with the common color-vision deficiencies. Okabe and Ito's
// palette does, with the neutral grey and white beside it: the smallest
// CIEDE2000 difference of any pair, with normal vision or simulated
// protanopia, deuteranopia or tritanopia, is about 10.9 (palette.spec.ts
// checks it). That caps a figure at seven colored families.

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
