import { FormControl } from '@angular/forms';
import { parseParams } from './index';
import { paramParsers, queryParamValidators } from '@gcv/gene/models/params';
import { regexpOr } from '@gcv/gene/utils/regexp-or.util';
import { Regex } from '@gcv/gene/constants';

// URL query strings are GCV's source of truth for every alignment, clustering and
// query parameter. parseParams coerces those raw strings into the typed values the
// engine consumes, and the param validators/regexes gate which values are accepted
// at all. A silent slip here — a string where a number is expected, or a bad value
// let through — changes scoring or filtering with no visible error. These tests pin
// the coercion and the numeric-value contract.

describe('parseParams', () => {
  it('coerces numeric alignment params, preserving negatives', () => {
    const raw = {
      match: '10',
      mismatch: '-1',
      gap: '-1',
      score: '30',
      threshold: '25',
    };
    expect(parseParams(raw, paramParsers)).toEqual({
      match: 10,
      mismatch: -1,
      gap: -1,
      score: 30,
      threshold: 25,
    });
  });

  it('splits a comma-separated sources string into an array', () => {
    expect(parseParams({ sources: 'lis' }, paramParsers).sources).toEqual([
      'lis',
    ]);
    expect(
      parseParams({ sources: 'lis,phytozome' }, paramParsers).sources,
    ).toEqual(['lis', 'phytozome']);
  });

  it('passes an already-array sources value through unchanged', () => {
    expect(
      parseParams({ sources: ['lis', 'phytozome'] }, paramParsers).sources,
    ).toEqual(['lis', 'phytozome']);
  });

  it('passes identity (string-valued) params through unchanged', () => {
    const raw = { algorithm: 'repeat', linkage: 'average', order: 'distance' };
    expect(parseParams(raw, paramParsers)).toEqual(raw);
  });

  it('drops keys that have no parser (unknown query params)', () => {
    const raw = { match: '5', notAParam: 'whatever' };
    expect(parseParams(raw, paramParsers)).toEqual({ match: 5 });
  });

  it('returns an empty object for empty input', () => {
    expect(parseParams({}, paramParsers)).toEqual({});
  });
});

describe('param validation regexes', () => {
  // Validators.pattern anchors a single pattern; test the anchored contract each
  // pattern encodes, since these are what gate accepted parameter values.
  const accepts = (pattern: string, value: string): boolean =>
    new RegExp('^(?:' + pattern + ')$').test(value);

  it('regexpOr wraps and or-joins its alternatives', () => {
    expect(regexpOr('a', 'b', 'c')).toBe('(a)|(b)|(c)');
  });

  it('POSITIVE_INT accepts positive integers only', () => {
    ['1', '10', '999'].forEach((v) =>
      expect(accepts(Regex.POSITIVE_INT, v)).toBe(true),
    );
    ['0', '-1', '01', '1.5', ''].forEach((v) =>
      expect(accepts(Regex.POSITIVE_INT, v)).toBe(false),
    );
  });

  it('POSITIVE_INT_AND_ZERO also accepts zero', () => {
    ['0', '1', '10'].forEach((v) =>
      expect(accepts(Regex.POSITIVE_INT_AND_ZERO, v)).toBe(true),
    );
    ['-1', '01', '00', ''].forEach((v) =>
      expect(accepts(Regex.POSITIVE_INT_AND_ZERO, v)).toBe(false),
    );
  });

  it('FRACTION_TO_ONE accepts fractions in (0,1] but not 0 or >1', () => {
    ['0.5', '0.05', '0.1', '1'].forEach((v) =>
      expect(accepts(Regex.FRACTION_TO_ONE, v)).toBe(true),
    );
    ['0', '0.0', '1.0', '1.5', '2', ''].forEach((v) =>
      expect(accepts(Regex.FRACTION_TO_ONE, v)).toBe(false),
    );
  });
});

describe('query param validators (real FormControl path)', () => {
  const isValid = (validator: any, value: string): boolean =>
    new FormControl(value, validator).valid;

  it('neighbors accepts a positive integer and rejects zero, negatives and fractions', () => {
    expect(isValid(queryParamValidators.neighbors, '10')).toBe(true);
    expect(isValid(queryParamValidators.neighbors, '0')).toBe(false);
    expect(isValid(queryParamValidators.neighbors, '-1')).toBe(false);
    expect(isValid(queryParamValidators.neighbors, '1.5')).toBe(false);
  });
});
