import { d3 } from "./d3";
import { Visualizer } from "./visualizer";

/** The legend viewer. */
export class Legend extends Visualizer {

  // Constants
  private RECT_SIZE: number;

  /** Resizes the viewer and x scale. Will be decorated by other components. */
  protected resize() {
    // viewer
    const w = this.container.clientWidth;
    this.viewer.attr("width", w);
  }

  /**
   * Parses parameters and initializes letiables.
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
    this.options.keyClick = this.options.keyClick || ((k) => { /* noop */ });
    this.options.autoResize = this.options.autoResize || false;
    this.options.hoverDelay = this.options.hoverDelay || 0;
    this.options.selector = this.options.selector || "";
    this.options.blank = this.options.blank || undefined;
    this.options.blankDashed = this.options.blankDashed || undefined;
    this.options.multiDelimiter = this.options.multiDelimiter || undefined;
    if (this.options.contextmenu) {
      this.viewer.on("contextmenu", () => {
        this.options.contextmenu(d3.event);
      });
    }
    if (this.options.click) {
      this.viewer.on("click", () => {
        this.options.click(d3.event);
      });
    }
    super.initResize();
  }

  /** Draws the viewer. */
  protected draw() {
    // draw the legend
    const legend = this.drawLegend();
    legend.attr("y", this.PAD);
    this.decorateResize(legend.resize);
    const lBox = legend.node().getBBox();
    this.viewer.attr("height", lBox.y + lBox.height + (2 * this.PAD));
    // create an auto resize iframe, if necessary
    if (this.options.autoResize) {
      this.resizer = this.autoResize(this.container, (e) => {
        this.resize();
      });
    }
    this.resize();
  }

  /**
   * Draws the legend key for the given family.
   * @param {object} legend - D3 selection of the legend to add the key to.
   * @param {object} f - The family for which a key is to be drawn.
   * @return {object} - D3 selection of the key.
   */
  private drawKey(legend, f) {
    const obj = this;
    // create the key group
    const key = legend.append("g")
      .attr("class", "legend")
      .attr("data-" + this.options.selector, f.id)
      .style("cursor", "pointer")
      .on("mouseover", () => {
        const selectors = [];
        for (const s of f.id.split(obj.options.multiDelimiter)) {
          selectors.push(".GCV [data-" + obj.options.selector + "='" + s + "']");
        }
        const selection = d3.selectAll(selectors.join(", "));
        obj.beginHover(selection);
      })
      .on("mouseout", () => {
        const selectors = [];
        for (const s of f.id.split(obj.options.multiDelimiter)) {
          selectors.push(".GCV [data-" + obj.options.selector + "='" + s + "']");
        }
        const selection = d3.selectAll(selectors.join(", "));
        obj.endHover(selection);
      })
      .on("click", () => {
        this.options.keyClick(f);
      });
    // add the colored rectangles
    const rect = key.append("rect")
      .attr("width", this.RECT_SIZE)
      .attr("height", this.RECT_SIZE)
      .style("fill", () => {
        if (f === this.options.blank || f === this.options.blankDashed) {
          return "#FFFFFF";
        }
        return this.colors(f.id);
      })
      .attr("class", () => {
        if (this.options.highlight.indexOf(f.name) !== -1) {
          return "focus";
        } else if (f === this.options.blank) {
          return "single";
        } else if (f === this.options.blankDashed) {
          return "no_fam";
        }
        return "";
      });
    // add then labels
    const text = key.append("text")
      .style("text-anchor", "end")
      .style("dominant-baseline", "middle")
      .attr("y", () => this.RECT_SIZE / 2)
      .text(() => f.name);
    // implement the resize function
    key.resize = function(rect, text) {
      const w = this.viewer.attr("width");
      let x = w - (this.PAD + this.RECT_SIZE);
      rect.attr("x", x);
      x -= (2 * this.PAD);
      text.attr("x", x);
    }.bind(this, rect, text);
    key.resize();
    return key;
  }

  /**
   * Creates a legend containing keys for the familyName families.
   * @return {object} - D3 selection of a group containing the keys.
   */
  private drawLegend() {
    const legend = this.viewer.append("g");
    // create the legend keys
    let entries = [];
    if (this.options.blank !== undefined) {
      entries.push(this.options.blank);
    }
    if (this.options.blankDashed !== undefined) {
      entries.push(this.options.blankDashed);
    }
    entries = entries.concat(this.data.filter((f) => {
      if (this.options.selectiveColoring) {
        return this.options.selectiveColoring[f.id] > 1;
      }
      return true;
    }));
    legend.keys = [];
    entries.forEach((f, i) => {
      const k = this.drawKey(legend, f);
      let y = legend.node().getBBox().height;
      if (i > 0) {
        y += 2 * this.PAD;
      }
      k.attr("transform", "translate(0, " + y + ")");
      legend.keys.push(k);
    });
    // implement the resize function
    legend.resize = function(keys) {
      keys.forEach((k) => { k.resize(); });
    }.bind(this, legend.keys);
    return legend;
  }
}
