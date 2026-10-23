import { argumentProblems } from './arguments';

const schema = {
  type: 'object',
  properties: {
    gene: { type: 'string', minLength: 1, maxLength: 5, pattern: '^g' },
    neighbors: { type: 'integer', minimum: 1, maximum: 100 },
    fraction: { type: 'number', exclusiveMinimum: 0, exclusiveMaximum: 1 },
    format: { type: 'string', enum: ['summary', 'tsv'] },
    wait: { type: 'boolean' },
    genes: {
      type: 'array',
      minItems: 1,
      maxItems: 2,
      items: {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
        additionalProperties: false,
      },
    },
    counts: { type: 'object', additionalProperties: { type: 'integer' } },
  },
  required: ['gene'],
  additionalProperties: false,
};

describe('argumentProblems', () => {
  it('accepts arguments the schema allows', () => {
    expect(
      argumentProblems(schema, {
        gene: 'g1',
        neighbors: 10,
        fraction: 0.5,
        format: 'tsv',
        wait: false,
        genes: [{ name: 'a' }, { name: 'b' }],
        counts: { a: 1 },
      }),
    ).toEqual([]);
  });

  it('counts a call without arguments as {}', () => {
    expect(argumentProblems(schema, undefined)).toEqual(['gene: is required']);
    expect(
      argumentProblems({ type: 'object', properties: {} }, undefined),
    ).toEqual([]);
  });

  it('reports every problem, with its path', () => {
    expect(
      argumentProblems(schema, {
        gene: '',
        neighbors: 1.5,
        fraction: 1,
        format: 'table',
        wait: 'yes',
        genes: [{ name: 'a', source: 'lis' }, {}, { name: 'c' }],
        counts: { a: 'one' },
        extra: true,
      }),
    ).toEqual([
      'gene: must have at least 1 character',
      'gene: must match ^g',
      'neighbors: must be integer, not 1.5',
      'fraction: must be less than 1, not 1',
      'format: must be one of "summary", "tsv", not "table"',
      'wait: must be boolean, not "yes"',
      'genes: must have at most 2 items',
      'genes[0].source: is not a parameter; use name',
      'genes[1].name: is required',
      'counts.a: must be integer, not "one"',
      'extra: is not a parameter; use gene, neighbors, fraction, format, wait, genes, counts',
    ]);
  });

  it('checks limits', () => {
    expect(
      argumentProblems(schema, { gene: 'g123456', neighbors: 0, fraction: 0 }),
    ).toEqual([
      'gene: must have at most 5 characters',
      'neighbors: must be at least 1, not 0',
      'fraction: must be more than 0, not 0',
    ]);
    expect(
      argumentProblems(schema, { gene: 'g', neighbors: 101, genes: [] }),
    ).toEqual([
      'neighbors: must be at most 100, not 101',
      'genes: must have at least 1 item',
    ]);
  });

  it('rejects null for an optional argument and non-object arguments', () => {
    expect(argumentProblems(schema, { gene: 'g', neighbors: null })).toEqual([
      'neighbors: must be integer, not null',
    ]);
    expect(argumentProblems(schema, 'gene')).toEqual([
      'must be object, not "gene"',
    ]);
  });
});
