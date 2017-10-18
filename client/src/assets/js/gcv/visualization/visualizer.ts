import { d3 } from './d3';


export abstract class Visualizer {
  // private
  protected colors: any;
  protected container: HTMLElement;
  protected data: any;
  protected options: any;
  protected resizer: any;
  protected viewer: any;

  // constants
  protected readonly PAD;

  /**
    * Adds a hidden iframe that calls the given resize event whenever its width
    * changes.
    * @param {string} el - The element to add the iframe to.
    * @param {function} f - The function to call when a resize event occurs.
    * @return {object} - The hidden iframe.
    */
  protected autoResize(el, f) {
    let iframe: any = document.createElement('IFRAME');
    iframe.setAttribute('allowtransparency', 'true');
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
  protected beginHoverTimeout;
  protected beginHover(selection) {
    clearTimeout(this.beginHoverTimeout);
    this.beginHoverTimeout = setTimeout(() => {
      d3.selectAll('.GCV').classed('hovering', true);
      selection.classed('active', true);
    }, this.options.hoverDelay);
  }

  /**
    * Unfades everything in the view and revokes the selection's omission from
    * being faded.
    * @param {object} selection - What's no longer omitted.
    */
  protected hoverTimeout = 0;
  protected endHover(selection) {
    selection.classed('active', false);
    // delay unfading for smoother mouse dragging
    clearTimeout(this.beginHoverTimeout);
    clearTimeout(this.hoverTimeout);
    this.hoverTimeout = setTimeout(function () {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = undefined;
      // make sure nothing is being hovered
      if (d3.selectAll('.GCV .active').empty()) {
        d3.selectAll('.GCV').classed('hovering', false);
      }
    }, 125);
  }

  protected abstract resize(): void;

  /**
    * Decorates the resize function with the given function.
    * @param {function} d - The decorator function.
    */
  protected decorateResize(d) {
    this.resize = function (resize) {
      resize();
      d();
    }.bind(this, this.resize);
  }

  protected initResize() {
    // make sure resize always has the right context
    this.resize = this.resize.bind(this);
    // initialize the viewer width/height and scale range
    this.resize();
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
    this.data = JSON.parse(JSON.stringify(data));
    // create the viewer
    this.viewer = d3.select(this.container)
      .append('svg')
      .attr('class', 'GCV');
  }

  protected abstract draw(): void;

  /**
    * The constructor.
    * @param {HTMLElement|string} el - ID of or the element itself where the
    * viewer will be drawn in.
    * @param {object} colors - D3 family-to-color map.
    * @param {object} data - The data the viewer will visualize.
    * @param {object} options - Optional parameters.
    */
  constructor(el, colors, data, options) {
    this.PAD = 2;
    this.init(el, colors, data, options);
    this.draw();
  }

  /** Makes a copy of the SVG and inlines external GCV styles. */
  protected inlineCopy(mod=(clone)=>{}) {
    // clone the current view node
    var clone = d3.select(this.viewer.node().cloneNode(true));
    mod(clone);
    // load the external styles
    let sheets: any = document.styleSheets;
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
    var clone = this.inlineCopy();
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
