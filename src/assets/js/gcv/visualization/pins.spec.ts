/**
 * @jest-environment jsdom
 */
import { d3 } from './d3';
import { Legend } from './legend';
import { Micro } from './micro';

// Drawing a viewer measures text, which jsdom can't, so these call setPins on
// SVGs built the way the viewers build them.

function microSVG() {
  const viewer = d3
    .select(document.body)
    .append('svg')
    .attr('class', 'GCV hovering');
  viewer
    .selectAll('.gene')
    .data([
      { name: 'g1', family: 'f1' },
      { name: 'g2', family: 'f2' },
      { name: 'g3', family: '' },
    ])
    .enter()
    .append('g')
    .attr('class', (g) => (g.name === 'g2' ? 'gene active' : 'gene'));
  return viewer;
}

const pinned = (viewer) =>
  viewer
    .selectAll('.pin')
    .data()
    .map((g) => g.name);

describe('Micro.setPins', () => {
  afterEach(() => (document.body.innerHTML = ''));

  it('marks pinned genes and the genes of pinned families', () => {
    const viewer = microSVG();
    Micro.prototype.setPins.call(
      { viewer },
      { genes: ['g1'], families: ['f2'] },
    );
    expect(pinned(viewer)).toEqual(['g1', 'g2']);
    expect(viewer.classed('pinned')).toBe(true);
    expect(viewer.classed('pin-labels')).toBe(true);
  });

  it('leaves hovering alone, and hovering leaves pins alone', () => {
    const viewer = microSVG();
    Micro.prototype.setPins.call({ viewer }, { genes: ['g1'] }, 'fade');
    expect(viewer.classed('hovering')).toBe(true);
    expect(viewer.select('.active').attr('class')).toBe('gene active');
    expect(viewer.classed('pin-labels')).toBe(false);
    viewer
      .classed('hovering', false)
      .selectAll('.active')
      .classed('active', false);
    expect(pinned(viewer)).toEqual(['g1']);
  });

  it("doesn't fade a viewer with none of the pins, or pin genes without a family", () => {
    const viewer = microSVG();
    Micro.prototype.setPins.call({ viewer }, { genes: ['gx'], families: [''] });
    expect(pinned(viewer)).toEqual([]);
    expect(viewer.classed('pinned')).toBe(false);
  });

  it('replaces the previous pins', () => {
    const viewer = microSVG();
    Micro.prototype.setPins.call({ viewer }, { genes: ['g1'] });
    Micro.prototype.setPins.call({ viewer }, { genes: ['g2'] });
    expect(pinned(viewer)).toEqual(['g2']);
    Micro.prototype.setPins.call({ viewer }, {});
    expect(viewer.classed('pinned')).toBe(false);
  });
});

describe('Legend.setPins', () => {
  afterEach(() => (document.body.innerHTML = ''));

  function legendSVG() {
    const viewer = d3.select(document.body).append('svg').attr('class', 'GCV');
    ['f1', 'singleton,f8,f9', ''].forEach((id) =>
      viewer.append('g').attr('class', 'legend').attr('data-family', id),
    );
    return viewer;
  }

  const pinnedKeys = (viewer) =>
    viewer
      .selectAll('.pin')
      .nodes()
      .map((k) => k.getAttribute('data-family'));

  it("marks a family's key, and the singletons' key for any of them", () => {
    const viewer = legendSVG();
    const legend = { viewer, options: { selector: 'family' } };
    Legend.prototype.setPins.call(legend, ['f1', 'f9']);
    expect(pinnedKeys(viewer)).toEqual(['f1', 'singleton,f8,f9']);
    expect(viewer.classed('pinned')).toBe(true);
    Legend.prototype.setPins.call(legend, ['f']);
    expect(pinnedKeys(viewer)).toEqual([]);
    expect(viewer.classed('pinned')).toBe(false);
  });
});
