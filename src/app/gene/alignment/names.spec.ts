import { matchGeneName } from './names';

describe('matchGeneName', () => {
  const names = [
    'glyma.Wm82.gnm4.ann1.Glyma.12G040000',
    'glyma.Wm82.gnm2.ann1.Glyma.12G040000',
    'phavu.G19833.gnm2.ann1.Phvul.002G085200',
  ];

  it('prefers the exact name', () => {
    expect(matchGeneName(names, names[0])).toEqual([names[0]]);
  });

  it('matches a name without its prefix, case-insensitively', () => {
    expect(matchGeneName(names, 'phvul.002g085200')).toEqual([names[2]]);
  });

  it('returns every full name an ambiguous name matches', () => {
    expect(matchGeneName(names, 'Glyma.12G040000')).toEqual(names.slice(0, 2));
  });

  it("doesn't match part of a name segment", () => {
    expect(matchGeneName(names, '2G040000')).toEqual([]);
  });
});
