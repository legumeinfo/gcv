import { d3 } from "./d3";
import { eventBus } from "../common"
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

  /** Handles events that come from the GCV eventBus.
   * @param {GCVevent} event - A GCV event containing a type and targets attributes.
   */
  protected eventHandler(event) {
    // select the relevant elements in the viewer
    let selection;
    if (event.targets.hasOwnProperty(this.options.selector)) {
      const selectors = [];
      event.targets[this.options.selector].split(",").forEach((f) => {
        selectors.push("[data-" + this.options.selector + "='" + f + "']");  // orphans
        selectors.push("[data-" + this.options.selector + "*='" + f + "']");  // singletons
      });
      selection = this.viewer.selectAll(selectors.join(", "));
    }
    // (un)fade the (un)selected elements
    switch(event.type) {
      case "select":
        this.viewer.classed("hovering", true);
        if (selection !== undefined) {
          selection.classed("active", true);
        }
        break;
      case "deselect":
        if (selection !== undefined) {
          selection.classed("active", false);
        }
        this.viewer.classed("hovering", false);
        break;
    }
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
    this.eventBus = eventBus.subscribe(this.eventHandler.bind(this));
    this.RECT_SIZE = 18;
    // create the scales used to plot genes
    // parse optional parameters
    this.options = Object.assign({}, options);
    this.options.highlight = this.options.highlight || [];
    this.options.checkboxes = this.options.checkboxes || [];
    this.options.checkboxCallback = this.options.checkboxCallback || ((id, checked) => { /* noop */ });
    this.options.selectiveColoring = this.options.selectiveColoring;
    this.options.keyClick = this.options.keyClick || ((k) => { /* noop */ });
    this.options.autoResize = this.options.autoResize || false;
    this.options.hoverDelay = this.options.hoverDelay || 0;
    this.options.selector = this.options.selector || "";
    this.options.blank = this.options.blank || undefined;
    this.options.blankDashed = this.options.blankDashed || undefined;
    this.options.multiDelimiter = this.options.multiDelimiter || undefined;
    this.options.sizeCallback = this.options.sizeCallback || ((s) => { /* noop */ });
    super.initResize();
  }

  /** Draws the viewer. */
  protected draw() {
    // draw the legend
    const legend = this.drawLegend();
    legend.attr("y", this.PAD);
    this.decorateResize(legend.resize);
    const lBox = legend.node().getBBox();
    this.options.sizeCallback({width: lBox.width, height: lBox.height});
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
    const row = legend.append("g");
    // create the key group
    const publishKeyEvent = (type) => {
      const event = {type, targets: {}};
      event.targets[obj.options.selector] = f.id;
      return () => eventBus.publish(event);
    };
    // add a key gorup to handle mouse events
    const key = row.append("g")
      .attr("class", "legend")
      .attr("data-" + this.options.selector, f.id)
      .style("cursor", "pointer")
      .on("mouseover", () => this.setTimeout(publishKeyEvent("select")))
      .on("mouseout", () => this.clearTimeout(publishKeyEvent("deselect")))
      .on("click", () => this.options.keyClick(f));
    // add the colored rectangles
    let shape;
    if (f.glyph === "circle") {
      shape = key.append("circle")
        .attr("r", this.RECT_SIZE/2)
        .attr("cy", () => this.RECT_SIZE / 2);
    } else {
      shape = key.append("rect")
        .attr("width", this.RECT_SIZE)
        .attr("height", this.RECT_SIZE);
    }
    shape
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
    // add optional key checkbox
    let foreigner = undefined;
    if (this.options.checkboxes.indexOf(f.id) !== -1) {
      foreigner = row.append("foreignObject")
          .attr("width", this.RECT_SIZE)
          .attr("height", this.RECT_SIZE);
      const checkbox = foreigner
        .append("xhtml:div")
        .attr("class", "checkbox")
          .attr("line-height", this.RECT_SIZE)
          .append("input")
          .attr("type", "checkbox");
      if (f.checked === undefined || f.checked) {
        checkbox.attr("checked", true);
      }
      checkbox
        .node().onclick = function () {
          obj.options.checkboxCallback(f.id, this.checked);
        };
    }
    // implement the resize function
    row.resize = function(f, shape, text, foreigner) {
      const w = this.viewer.attr("width");
      let x = w - (this.PAD + this.RECT_SIZE);
      if (f.glyph === "circle") {
        shape.attr("cx", x + this.RECT_SIZE/2)
      } else {
        shape.attr("x", x);
      }
      x -= (2 * this.PAD);
      text.attr("x", x);
      if (foreigner !== undefined) {
        x -= this.RECT_SIZE + text.node().getComputedTextLength();
        foreigner.attr("x", x);
      }
    }.bind(this, f, shape, text, foreigner);
    row.resize();
    return row;
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
