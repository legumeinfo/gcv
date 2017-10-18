import { d3 }         from './d3';
import { Visualizer } from './visualizer';


/** The legend viewer. */
export class Legend extends Visualizer {

  // Constants
  private RECT_SIZE: number;

  /** Resizes the viewer and x scale. Will be decorated by other components. */
  protected resize() {
    // viewer
    var w = this.container.clientWidth;
    this.viewer.attr('width', w);
  }

  /**
    * Parses parameters and initializes variables.
    * @param {HTMLElement|string} el - ID of or the element itself where the
    * viewer will be drawn in.
    * @param {object} colors - Datum-to-color map.
    * @param {object} data - A list of objects with name and id attributes.
    * @param {object} options - Optional parameters.
    */
  protected init(el, colors, data, options?) {
    super.init(el, colors, data);
    this.RECT_SIZE = 18;
    // create the scales used to plot genes
    // parse optional parameters
    this.options = Object.assign({}, options);
    this.options.highlight = this.options.highlight || [];
    this.options.selectiveColoring = this.options.selectiveColoring;
    this.options.keyClick = this.options.keyClick || function (k) { };
    this.options.autoResize = this.options.autoResize || false;
    this.options.hoverDelay = this.options.hoverDelay || 0;
    this.options.selector = this.options.selector || '';
    if (this.options.contextmenu)
      this.viewer.on('contextmenu', () => {
        this.options.contextmenu(d3.event);
      });
    if (this.options.click)
      this.viewer.on('click', () => {
        this.options.click(d3.event);
      });
    super.initResize();
  }

  /**
    * Draws the legend key for the given family.
    * @param {object} legend - D3 selection of the legend to add the key to.
    * @param {object} f - The family for which a key is to be drawn.
    * @return {object} - D3 selection of the key.
    */
  private drawKey(legend, f) {
    var obj = this;
    // create the key group
    var key = legend.append('g')
      .attr('class', 'legend')
      .attr('data-' + this.options.selector, f.id)
  	  .style('cursor', 'pointer')
      .on('mouseover', function () {
        var selector = '.GCV [data-' + obj.options.selector + '="' + f.id + '"]';
        var selection = d3.selectAll(selector);
        obj.beginHover(selection);
      })
  	  .on('mouseout', function () {
        var selector = '.GCV [data-' + obj.options.selector + '="' + f.id + '"]';
        var selection = d3.selectAll(selector);
        obj.endHover(selection);
      })
      .on('click', () => {
        this.options.keyClick(f);
      });
    // add the colored rectangles
    var rect = key.append('rect')
      .attr('width', this.RECT_SIZE)
      .attr('height', this.RECT_SIZE)
      .style('fill', () => this.colors(f.id))
      .attr('class', () => {
        if (this.options.highlight.indexOf(f.name) !== -1) return 'focus';
        return '';
      });
    // add then labels
    var text = key.append('text')
      .style('text-anchor', 'end')
      .style('dominant-baseline', 'middle')
      .attr('y', () => this.RECT_SIZE / 2)
      .text(() => f.name);
    // implement the resize function
    key.resize = function (rect, text) {
      var w = this.viewer.attr('width'),
          x = w - (this.PAD + this.RECT_SIZE);
      rect.attr('x', x);
      x -= (2 * this.PAD);
      text.attr('x', x);
    }.bind(this, rect, text);
    key.resize();
    return key;
  }

  /**
    * Creates a legend containing keys for the familyName families.
    * @return {object} - D3 selection of a group containing the keys.
    */
  private drawLegend() {
    var legend = this.viewer.append('g');
    // create the legend keys
    var entries = this.data.filter(f => {
      if (this.options.selectiveColoring)
        return this.options.selectiveColoring[f.id] > 1;
      return true;
    });
    legend.keys = [];
    entries.forEach((f, i) => {
      var k = this.drawKey(legend, f),
          y = legend.node().getBBox().height;
      if (i > 0) y += 2 * this.PAD;
      k.attr('transform', 'translate(0, ' + y + ')');
      legend.keys.push(k);
    });
    // implement the resize function
    legend.resize = function (keys) {
      keys.forEach(k => { k.resize(); });
    }.bind(this, legend.keys);
    return legend;
  }

  /** Draws the viewer. */
  protected draw() {
    // draw the legend
    var legend = this.drawLegend();
    legend.attr('y', this.PAD);
    this.decorateResize(legend.resize);
    var lBox = legend.node().getBBox();
    this.viewer.attr('height', lBox.y + lBox.height + (2 * this.PAD));
    // create an auto resize iframe, if necessary
    if (this.options.autoResize) {
      this.resizer = this.autoResize(this.container, (e) => {
        this.resize();
      });
    }
  }
}
