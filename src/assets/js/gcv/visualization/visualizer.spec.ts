/**
 * @jest-environment jsdom
 */
import { Visualizer } from './visualizer';

// draws one circle with its fill set inline, as the viewers set family colors
class Circle extends Visualizer {
  protected init(el, colors, data, options) {
    super.init(el, colors, data);
    this.options = options;
  }

  protected draw() {
    this.viewer
      .append('g')
      .attr('class', 'gene')
      .append('circle')
      .attr('class', 'point')
      .style('fill', 'rgb(1, 2, 3)');
  }

  protected resize() {
    /* noop */
  }

  copy(): SVGElement {
    return this.inlineCopy().node();
  }
}

describe('inlineCopy', () => {
  let viewer: Circle;

  beforeEach(() => {
    const style = document.createElement('style');
    style.textContent = `
      .GCV { font-size: 10px; }
      .GCV.pinned { fill-opacity: 0.25; }
      .GCV .point { stroke: black; fill: white; }
      .other { stroke: red; }
    `;
    document.head.appendChild(style);
    const container = document.createElement('div');
    document.body.appendChild(container);
    viewer = new Circle(container, {}, [], {});
  });

  afterEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  it('copies the rules that match the SVG itself', () => {
    viewer['viewer'].classed('pinned', true);
    const svg = viewer.copy();
    expect(svg.style.getPropertyValue('font-size')).toBe('10px');
    expect(svg.style.getPropertyValue('fill-opacity')).toBe('0.25');
  });

  it('copies the rules that match its elements, but not other rules', () => {
    const point = viewer.copy().querySelector('circle');
    expect(point.style.getPropertyValue('stroke')).toBe('black');
    expect(viewer.copy().style.getPropertyValue('stroke')).toBe('');
  });

  it('keeps the properties an element sets inline', () => {
    const point = viewer.copy().querySelector('circle');
    expect(point.style.getPropertyValue('fill')).toBe('rgb(1, 2, 3)');
  });

  it('leaves the viewer on screen unchanged', () => {
    viewer.copy();
    const svg = document.querySelector('svg');
    expect(svg.getAttribute('style')).toBeNull();
  });
});
