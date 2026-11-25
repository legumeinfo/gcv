import { ENCODINGS, HOLLOW, NEUTRAL, PALETTE, contrast } from './palette';

// A figure's colors must stay unambiguous for readers with the common
// color-vision deficiencies. This simulates them (Machado, Oliveira and
// Fernandes 2009, at full severity, in linear RGB) and requires every pair
// of the figure's colors to differ by at least MIN_DIFFERENCE in CIEDE2000,
// so a change to the palette can't make two families look alike.
const MIN_DIFFERENCE = 10;

type RGB = [number, number, number];
type Lab = [number, number, number];

const SIMULATIONS: Record<string, number[][]> = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};

const rgb = (hex: string): RGB =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as RGB;
const linear = (c: number) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const encoded = (c: number) => {
  const v = Math.min(1, Math.max(0, c));
  return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
};

function simulate(color: RGB, matrix: number[][]): RGB {
  const l = color.map(linear);
  return matrix.map((row) =>
    encoded(row.reduce((sum, m, j) => sum + m * l[j], 0)),
  ) as RGB;
}

function lab(color: RGB): Lab {
  const [r, g, b] = color.map(linear);
  const X = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b;
  const Y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const Z = 0.0193339 * r + 0.119192 * g + 0.9503041 * b;
  const f = (t: number) =>
    t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116;
  const [fx, fy, fz] = [f(X / 0.95047), f(Y), f(Z / 1.08883)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

const rad = (d: number) => (d * Math.PI) / 180;

// Sharma, Wu and Dalal (2005)
function ciede2000([L1, a1, b1]: Lab, [L2, a2, b2]: Lab): number {
  const Cb = (Math.hypot(a1, b1) + Math.hypot(a2, b2)) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)));
  const [a1p, a2p] = [(1 + G) * a1, (1 + G) * a2];
  const [C1p, C2p] = [Math.hypot(a1p, b1), Math.hypot(a2p, b2)];
  const hue = (a: number, b: number) =>
    a === 0 && b === 0 ? 0 : ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
  const [h1p, h2p] = [hue(a1p, b1), hue(a2p, b2)];
  const dL = L2 - L1;
  const dC = C2p - C1p;
  let dh = 0;
  if (C1p * C2p !== 0) {
    dh = h2p - h1p;
    if (dh > 180) dh -= 360;
    else if (dh < -180) dh += 360;
  }
  const dH = 2 * Math.sqrt(C1p * C2p) * Math.sin(rad(dh / 2));
  const Lb = (L1 + L2) / 2;
  const Cbp = (C1p + C2p) / 2;
  let hb = h1p + h2p;
  if (C1p * C2p !== 0) {
    if (Math.abs(h1p - h2p) <= 180) hb = (h1p + h2p) / 2;
    else if (h1p + h2p < 360) hb = (h1p + h2p + 360) / 2;
    else hb = (h1p + h2p - 360) / 2;
  }
  const T =
    1 -
    0.17 * Math.cos(rad(hb - 30)) +
    0.24 * Math.cos(rad(2 * hb)) +
    0.32 * Math.cos(rad(3 * hb + 6)) -
    0.2 * Math.cos(rad(4 * hb - 63));
  const dTheta = 30 * Math.exp(-(((hb - 275) / 25) ** 2));
  const RC = 2 * Math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7));
  const SL = 1 + (0.015 * (Lb - 50) ** 2) / Math.sqrt(20 + (Lb - 50) ** 2);
  const SC = 1 + 0.045 * Cbp;
  const SH = 1 + 0.015 * Cbp * T;
  const RT = -Math.sin(rad(2 * dTheta)) * RC;
  return Math.sqrt(
    (dL / SL) ** 2 +
      (dC / SC) ** 2 +
      (dH / SH) ** 2 +
      RT * (dC / SC) * (dH / SH),
  );
}

describe('the color difference', () => {
  // pairs from Sharma, Wu and Dalal's test data
  it('matches the published CIEDE2000 values', () => {
    expect(ciede2000([50, 2.6772, -79.7751], [50, 0, -82.7485])).toBeCloseTo(
      2.0425,
      4,
    );
    expect(ciede2000([50, -1, 2], [50, 0, 0])).toBeCloseTo(2.3669, 4);
    expect(
      ciede2000([60.2574, -34.0099, 36.2677], [60.4626, -34.1751, 39.4387]),
    ).toBeCloseTo(1.2644, 4);
  });
});

describe('the figure palette', () => {
  const colors = [...PALETTE, NEUTRAL, HOLLOW];
  const visions: [string, (c: RGB) => RGB][] = [
    ['normal vision', (c) => c],
    ...Object.entries(SIMULATIONS).map(
      ([name, m]): [string, (c: RGB) => RGB] => [name, (c) => simulate(c, m)],
    ),
  ];

  it('has no repeated color', () => {
    expect(new Set(colors.map((c) => c.toUpperCase())).size).toBe(
      colors.length,
    );
  });

  it.each(visions)('keeps every pair of colors distinct with %s', (_, see) => {
    const seen = colors.map((c) => lab(see(rgb(c))));
    const close: string[] = [];
    seen.forEach((a, i) =>
      seen.slice(i + 1).forEach((b, j) => {
        const d = ciede2000(a, b);
        if (d < MIN_DIFFERENCE) {
          close.push(`${colors[i]} ${colors[i + 1 + j]}: ${d.toFixed(1)}`);
        }
      }),
    );
    expect(close).toEqual([]);
  });
});

describe('the encodings past the palette', () => {
  it('gives each of 21 families its own color and pattern', () => {
    const keys = ENCODINGS.map((e) => `${e.fill} ${e.pattern?.kind}`);
    expect(new Set(keys).size).toBe(3 * PALETTE.length);
    expect(ENCODINGS.slice(0, PALETTE.length).map((e) => e.fill)).toEqual(
      PALETTE,
    );
  });

  // WCAG 1.4.11's 3:1 for graphics, so a pattern shows on its color
  it('draws each pattern in ink that contrasts 3:1 with its color', () => {
    const faint = ENCODINGS.filter(
      (e) => e.pattern !== undefined && contrast(e.pattern.ink, e.fill) < 3,
    ).map((e) => `${e.pattern.ink} on ${e.fill}`);
    expect(faint).toEqual([]);
  });

  it('measures contrast as WCAG does', () => {
    expect(contrast('#FFFFFF', '#000000')).toBeCloseTo(21);
    expect(contrast('#777777', '#FFFFFF')).toBeCloseTo(4.48, 2);
  });
});
