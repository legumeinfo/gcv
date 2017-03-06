'use strict'


/** The Genomic Context Viewer namespace. */
var GCV = GCV || {};


/** The legend viewer. */
GCV.Legend = class {

  // Private

  // Constants
  _PAD       = 2;
  _RECT_SIZE = 18;

  /**
    * Adds a hidden iframe that calls the given resize event whenever its width
    * changes.
    * @param {string} el - The element to add the iframe to.
    * @param {function} f - The function to call when a resize event occurs.
    * @return {object} - The hidden iframe.
    */
  _autoResize(el, f) {
    var iframe = document.createElement('IFRAME');
    iframe.setAttribute('allowtransparency', true);
    iframe.className = 'GCV-resizer';
    el.appendChild(iframe);
    iframe.contentWindow.onresize = function () {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(f, 10)
    };
    return iframe;
  }

  /**
    * Fades everything in the view besides the given selection.
    * @param {object} selection - What's omitted from the fade.
    */
  _beginHoverTimeout;
  _beginHover(selection) {
    clearTimeout(this._beginHoverTimeout);
    this._beginHoverTimeout = setTimeout(() => {
      d3.selectAll('.GCV').classed('hovering', true);
      selection.classed('active', true);
    }, this.options.hoverDelay);
  }

  /**
    * Unfades everything in the view and revokes the selection's omission from
    * being faded.
    * @param {object} selection - What's no longer omitted.
    */
  _hoverTimeout = 0;
  _endHover(selection) {
    selection.classed('active', false);
    // delay unfading for smoother mouse dragging
    clearTimeout(this._beginHoverTimeout);
    clearTimeout(this._hoverTimeout);
    this._hoverTimeout = setTimeout(function () {
      clearTimeout(this._hoverTimeout);
      this._hoverTimeout = undefined;
      // make sure nothing is being hovered
      if (d3.selectAll('.GCV .active').empty()) {
        d3.selectAll('.GCV').classed('hovering', false);
      }
    }, 125);
  }

  /** Resizes the viewer and x scale. Will be decorated by other components. */
  _resize() {
    // viewer
    var w = this.container.clientWidth;
    this.viewer.attr('width', w);
  }

  /**
    * Decorates the _resize function with the given function.
    * @param {function} d - The decorator function.
    */
  _decorateResize(d) {
    this._resize = function (resize) {
      resize();
      d();
    }.bind(this, this._resize);
  }

  /**
    * Parses parameters and initializes variables.
    * @param {HTMLElement|string} el - ID of or the element itself where the
    * viewer will be drawn in.
    * @param {object} colors - D3 family-to-color map.
    * @param {object} data - The data the viewer will visualize.
    * @param {object} options - Optional parameters.
    */
  _init(el, colors, data, options) {
    // parse positional parameters
    if (el instanceof HTMLElement)
      this.container = el;
    else
      this.container = document.getElementById(el);
    if (this.container === null) {
      throw new Error('"' + el + '" is not a valid element/ID');
    }
    this.colors = colors;
    if (this.colors === undefined) {
      throw new Error('"color" is undefined');
    }
    if (data === undefined) {
      throw new Error('"data" is undefined');
    }
    this.data = JSON.parse(JSON.stringify(data));;
    var seen = {};
    this.data.families = this.data.families.reduce((l, f) => {
      if (!seen[f.id]) {
        seen[f.id] = true;
        l.push(f);
      } return l;
    }, []);
    // create the viewer
    this.viewer = d3.select(this.container)
      .append('svg')
      .attr('class', 'GCV');
    // create the scales used to plot genes
    // parse optional parameters
    this.options = Object.assign({}, options);
    this.options.highlight = this.options.highlight || [];
    this.options.selectiveColoring = this.options.selectiveColoring;
    this.options.familyClick = this.options.familyClick || function (family) { };
    this.options.autoResize = this.options.autoResize || false;
    this.options.hoverDelay = this.options.hoverDelay || 0;
    if (this.options.contextmenu)
      this.viewer.on('contextmenu', () => {
        this.options.contextmenu(d3.event);
      });
    if (this.options.click)
      this.viewer.on('click', () => {
        this.options.click(d3.event);
      });
    // make sure resize always has the right context
    this._resize = this._resize.bind(this);
    // initialize the viewer width/height and scale range
    this._resize();
  }

  /**
    * Draws the legend key for the given family.
    * @param {object} legend - D3 selection of the legend to add the key to.
    * @param {object} f - The family for which a key is to be drawn.
    * @return {object} - D3 selection of the key.
    */
  _drawKey(legend, f) {
    var obj = this;
    // create the key group
    var key = legend.append('g')
      .attr('class', 'legend')
      .attr('data-family', f.id)
  	  .style('cursor', 'pointer')
      .on('mouseover', function () {
        var selection = d3.selectAll('.GCV [data-family="' + f.id + '"]');
        obj._beginHover(selection);
      })
  	  .on('mouseout', function () {
        var selection = d3.selectAll('.GCV [data-family="' + f.id + '"]');
        obj._endHover(selection);
      })
      .on('click', () => {
        this.options.familyClick(f);
      });
    // add the colored rectangles
    var rect = key.append('rect')
      .attr('width', this._RECT_SIZE)
      .attr('height', this._RECT_SIZE)
      .style('fill', () => this.colors(f.id))
      .attr('class', () => {
        if (this.options.highlight.indexOf(f.name) !== -1) return 'focus';
        return '';
      });
    // add then labels
    var text = key.append('text')
      .style('text-anchor', 'end')
      .style('dominant-baseline', 'middle')
      .attr('y', () => this._RECT_SIZE / 2)
      .text(() => f.name);
    // implement the resize function
    key.resize = function (rect, text) {
      var w = this.viewer.attr('width'),
          x = w - (this._PAD + this._RECT_SIZE);
      rect.attr('x', x);
      x -= (2 * this._PAD);
      text.attr('x', x);
    }.bind(this, rect, text);
    key.resize();
    return key;
  }

  /**
    * Creates a legend containing keys for the familyName families.
    * @return {object} - D3 selection of a group containing the keys.
    */
  _drawLegend() {
    var legend = this.viewer.append('g');
    // create the legend keys
    var presentFamilies = this.data.groups.reduce((l, group) => {
      return l.concat(group.genes.map(g => g.family));
    }, []);
    var families = this.data.families.filter(f => {
      return presentFamilies.indexOf(f.id) != -1
          && !(f.name == ''
          || (this.options.selectiveColoring !== undefined
             && this.options.selectiveColoring[f.id] == 1));
    });
    legend.keys = [];
    families.forEach((f, i) => {
      var k = this._drawKey(legend, f),
          y = legend.node().getBBox().height;
      if (i > 0) y += 2 * this._PAD;
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
  _draw() {
    // draw the legend
    var legend = this._drawLegend();
    legend.attr('y', this._PAD);
    this._decorateResize(legend.resize);
    var lBox = legend.node().getBBox();
    this.viewer.attr('height', lBox.y + lBox.height + (2 * this._PAD));
    // create an auto resize iframe, if necessary
    if (this.options.autoResize) {
      this.resizer = this._autoResize(this.container, (e) => {
        this._resize();
      });
    }
  }
  
  // Public

  /**
    * The constructor.
    * @param {HTMLElement|string} el - ID of or the element itself where the
    * viewer will be drawn in.
    * @param {object} colors - D3 family-to-color map.
    * @param {object} data - The data the viewer will visualize.
    * @param {object} options - Optional parameters.
    */
  constructor(el, colors, data, options) {
    this._init(el, colors, data, options);
    this._draw();
  }

  /** Makes a copy of the SVG and inlines external GCV styles. */
  _inlineCopy() {
    // clone the current view node
    var clone = d3.select(this.viewer.node().cloneNode(true));
    // load the external styles
    var sheets = document.styleSheets;
    // inline GCV styles
    for (var i = 0; i < sheets.length; i++) {
      var rules = sheets[i].rules || sheets[i].cssRules;
      for (var r in rules) {
        var rule = rules[r],
            selector = rule.selectorText;
        if (selector !== undefined && selector.startsWith('.GCV')) {
          var style = rule.style,
              selection = clone.selectAll(selector);
          for (var k = 0; k < style.length; k++) {
            var prop = style[k];
            selection.style(prop, style[prop]);
          }
        }
      }
    }
    return clone;
	}

  /** Generates the raw SVG xml. */
  xml() {
    try {
      var isFileSaverSupported = !!new Blob();
    } catch (e) {
      alert("Your broswer does not support saving");
    }
    // create a clone of the viewer with all GCV styles inlined
    var clone = this._inlineCopy();
    // generate the data
    var xml = (new XMLSerializer).serializeToString(clone.node());
    return xml;
  }

  /** Manually destroys the viewer. */
  destroy() {
    if (this.resizer) {
      if (this.resizer.contentWindow)
        this.resizer.contentWindow.onresize = undefined;
      this.container.removeChild(this.resizer);
    }
    this.container.removeChild(this.viewer.node());
    this.container = this.viewer = this.resizer = undefined;
  }
}
