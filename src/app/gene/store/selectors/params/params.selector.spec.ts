import { getFigureParams, getParams } from './index';

// The figure's parameter must never reach the analysis parameters, which
// drive searches, alignment and clustering and which the agent tools that
// change the analysis read.
describe('the gene view parameters', () => {
  it('read the figure from the URL, and keep it out of the analysis', () => {
    const queryParams = { neighbors: '12', fig: 'cl:g1;w:85' };
    expect(getFigureParams.projector(queryParams).fig).toEqual({
      cl: 'g1',
      w: 85,
    });
    const params = getParams.projector(queryParams);
    expect(params).toMatchObject({ neighbors: 12 });
    expect(params).not.toHaveProperty('fig');
  });

  it('default to no figure', () => {
    expect(getFigureParams.projector({ neighbors: '12' })).toEqual({
      fig: null,
    });
  });
});
