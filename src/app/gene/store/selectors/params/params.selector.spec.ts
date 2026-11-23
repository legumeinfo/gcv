import { getAnnotationParams, getParams } from './index';

// Pins mark the view; they must never reach the analysis parameters, which
// drive searches, alignment and clustering and which the agent tools that
// change the analysis read.
describe('the gene view parameters', () => {
  const queryParams = {
    neighbors: '12',
    pinfam: 'f1,f2',
    pingene: 'g1',
    pinlabels: 'fade',
  };

  it('keep the pins out of the analysis parameters', () => {
    const params = getParams.projector(queryParams);
    expect(params).toMatchObject({ neighbors: 12 });
    expect(params).not.toHaveProperty('pinfam');
    expect(params).not.toHaveProperty('pingene');
    expect(params).not.toHaveProperty('pinlabels');
  });

  it('read the pins from the URL', () => {
    expect(getAnnotationParams.projector(queryParams)).toEqual({
      pinfam: ['f1', 'f2'],
      pingene: ['g1'],
      pinlabels: 'fade',
      annot: { items: [], rejected: [] },
      fig: null,
    });
  });

  it('default to no pins, with full labels, and no figure', () => {
    expect(getAnnotationParams.projector({ neighbors: '12' })).toEqual({
      pinfam: [],
      pingene: [],
      pinlabels: 'full',
      annot: { items: [], rejected: [] },
      fig: null,
    });
  });

  it('read the figure from the URL, and keep it out of the analysis', () => {
    const queryParams = { fig: 'cl:g1;w:85' };
    expect(getAnnotationParams.projector(queryParams).fig).toEqual({
      cl: 'g1',
      w: 85,
    });
    expect(getParams.projector(queryParams)).not.toHaveProperty('fig');
  });
});
