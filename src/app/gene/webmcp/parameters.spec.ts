import { AppConfig, Server } from '@gcv/core/models';
import { paramMembers } from '@gcv/gene/models/params';
import { parameterSchemas, validateParameterUpdate } from './parameters';

describe('parameterSchemas', () => {
  it('describes every URL parameter of the gene view', () => {
    expect(Object.keys(parameterSchemas()).sort()).toEqual(
      [...paramMembers].sort(),
    );
  });
});

describe('validateParameterUpdate', () => {
  let servers: Server[];

  beforeEach(() => {
    servers = AppConfig.instance.servers;
    AppConfig.instance.servers = [
      { id: 'lis', name: 'LIS', microSearch: {} },
      { id: 'other', name: 'Other', microSearch: {} },
    ] as unknown as Server[];
  });

  afterEach(() => {
    AppConfig.instance.servers = servers;
  });

  it('accepts valid values', () => {
    const update = {
      neighbors: 15,
      matched: 0.5,
      algorithm: 'smith-waterman',
      gap: -2,
      sources: ['other'],
      regexp: 'Phaseolus',
    };
    expect(validateParameterUpdate(update)).toEqual({
      params: update,
      errors: [],
    });
  });

  it('rejects values the URL guard would reject', () => {
    const { params, errors } = validateParameterUpdate({
      neighbors: 0,
      gap: 3,
      linkage: 'ward',
    });
    expect(params).toEqual({});
    expect(errors).toEqual([
      'neighbors: invalid value 0; must be an integer ≥ 1',
      'gap: invalid value 3; must be an integer ≤ -1',
      'linkage: invalid value "ward"; must be one of average, single, complete',
    ]);
  });

  it('rejects unknown sources, parameters and broken regular expressions', () => {
    const { errors } = validateParameterUpdate({
      sources: ['nowhere'],
      colour: 'red',
      bregexp: '(',
    });
    expect(errors).toEqual([
      'sources: unknown nowhere; choose from lis, other',
      'colour: not a parameter',
      'bregexp: not a valid regular expression',
    ]);
  });
});
