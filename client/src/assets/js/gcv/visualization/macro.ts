import { d3 } from "./d3";
import { eventBus } from "../common"
import { Visualizer } from "./visualizer";

/** The macro-synteny viewer. */
export class Macro extends Visualizer {

  // Private
  private block: any;
  private left: number;
  private right: number;
  private scale: any;

  // Constants
  private BLOCK_HEIGHT: number;
  private PTR_LEN: number;

  /**
   * The constructor.
   * @param {HTMLElement|string} el - ID of or the element itself where the
   * viewer will be drawn in.
   * @param {object} data - The data the viewer will visualize.
   * @param {object} options - Optional parameters.
   */
  constructor(el, data, options) {
    super(el, data,
      (options && options.colors) || ((s) => "#000000"), options);
  }

  /** Resizes the viewer and scale. Will be decorated by other components. */
  protected resize() {
    const w = this.container.clientWidth;
    const r1 = this.left + (2 * this.PAD);
    const r2 = w - (this.right + this.PAD);
    this.viewer.attr("width", w);
    this.scale.range([r1, r2]);
  }

  /** Handles events that come from the GCV eventBus.
   * @param {GCVevent} event - A GCV event containing a type and targets attributes.
   */
  protected eventHandler(event) {
    // select the relevant elements in the viewer
    let selection;
    if (event.targets.hasOwnProperty("block")) {
      const block = event.targets.block;
      if (block.reference.chromosome === this.data.chromosome) {
        const selector = "[data-chromosome='" + block.source.chromosome + "'] " +
                         "[data-locus='" + block.source.locus.join(":") + "']" +
                         "[data-reference-locus='" + block.reference.locus.join(":") + "']" +
                         "[data-orientation='" + block.orientation + "']";
        selection = this.viewer.selectAll(selector);
      } else if (block.source.chromosome === this.data.chromosome) {
        const selector = "[data-chromosome='" + block.reference.chromosome + "'] " +
                         "[data-locus='" + block.reference.locus.join(":") + "']" +
                         "[data-reference-locus='" + block.source.locus.join(":") + "']" +
                         "[data-orientation='" + block.orientation + "']";
        selection = this.viewer.selectAll(selector);
      }
    } else if (event.targets.hasOwnProperty("chromosome")) {
      const selector = "[data-chromosome='" + event.targets.chromosome + "']";
      selection = this.viewer.selectAll(selector);
    } else if (event.targets.hasOwnProperty("organism")) {
      const selector = "[data-organism='" + event.targets.organism + "']";
      selection = this.viewer.selectAll(selector);
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
   * @param {object} data - The data the viewer will visualize.
   * @param {object} options - Optional parameters.
   */
  protected init(el, data, colors, options) {
    super.init(el, colors, data);
    this.eventBus = eventBus.subscribe(this.eventHandler.bind(this));
    this.viewer.attr("height", this.PAD);
    this.BLOCK_HEIGHT = 11;
    this.PTR_LEN      = 5;
    // compute the space required for chromosome names
    const chromosomes = data.tracks.map((t) => t.chromosome);
    this.left = 0;
    this.right = this.PAD;
    // create the scale used to map block coordinates to pixels
    this.scale = d3.scaleLinear()
      .domain([0, data.length]);
    super.initResize();
    // parse optional parameters
    this.options = Object.assign({}, options);
    this.options.nameClick = this.options.nameClick || ((y, i) => { /* noop */ });
    this.options.blockClick = this.options.blockClick || ((b) => { /* noop */ });
    this.options.viewportDrag = this.options.viewportDrag;
    this.options.viewport = this.options.viewport || false;
    this.options.autoResize = this.options.autoResize || false;
    this.options.hoverDelay = this.options.hoverDelay || 500;
    this.options.highlight = this.options.highlight || [];
    if (this.options.contextmenu) {
      this.viewer.on("contextmenu", () => this.options.contextmenu(d3.event));
    }
    if (this.options.click) {
      this.viewer.on("click", () => this.options.click(d3.event));
    }
  }

  /** Draws the viewer. */
  protected draw() {
    // draw the x-axis
    const xAxis = this.drawXAxis();
    this.positionElement(xAxis);
    // decorate the resize function with that of the x-axis
    this.decorateResize(xAxis.resize);
    // draw the tracks
    const ticks = [];
    const tracks = [];
    const t = this.viewer.attr("height");
    for (let i = 0; i < this.data.tracks.length; i++) {
      // make the track
      const track = this.drawTrack(i);
      // put it in the correct location
      const m = this.positionElement(track);
      // save the track"s label location
      ticks.push(m);
      // save the track for the resize call
      tracks.push(track);
    }
    const b = this.viewer.attr("height");
    // decorate the resize function with that of the track
    const resizeTracks = () => {
      tracks.forEach((t, i) => {
        t.resize();
      });
    };
    this.decorateResize(resizeTracks);
    // rotate the tips now that all the tracks have been drawn
    tracks.forEach((t, i) => {
      t.adjustTips();
    });
    // move all tips to front
    this.viewer.selectAll(".synteny-tip").moveToFront();
    // draw the y-axis
    const yAxis = this.drawYAxis(ticks, t, b);
    this.left = Math.max(xAxis.labelWidth, yAxis.node().getBBox().width)
              + this.PAD;
    yAxis.attr("transform", "translate(" + this.left + ", 0)");
    this.left += this.PAD;
    this.resize();
    // draw the viewport
    if (this.options.viewport) {
      const viewport = this.drawViewport();
      this.decorateResize(viewport.resize);
    }
    // create an auto resize iframe, if necessary
    if (this.options.autoResize) {
      this.resizer = this.autoResize(this.container, (e) => {
        this.resize();
      });
    }
    // add bottom padding
    const h = parseInt(this.viewer.attr("height"), 10) + this.PAD;
    this.viewer.attr("height", h);
    this.resize();
  }

  /**
   * Creates the viewport over the specified genomic interval.
   * @return {object} - D3 selection of the viewport.
   */
  private drawViewport() {
    const h = parseInt(this.viewer.attr("height"), 10) - this.PAD;
    const viewport = this.viewer.append("rect")
      .attr("class", "viewport")
      .attr("y", this.PAD)
      .attr("height", h)
      .attr("cursor", (d) => {
        if (this.options.viewportDrag) {
          return "move";
        }
        return "auto";
      })
      // translate viewport mouse events to block mouse events
      .on("mouseover", () => {
        const el = this.secondElementUnderPointer(d3.event);
        this.artificialHover(el);
      })
      .on("mouseout", () => {
        const e = d3.event;
        const el = document.elementFromPoint(e.clientX, e.clientY);
        this.artificialHover(el);
      })
      .on("mousemove", () => {
        const el = this.secondElementUnderPointer(d3.event);
        this.artificialHover(el);
      })
      .on("click", () => {
        const el = this.secondElementUnderPointer(d3.event);
        if (el.classList.contains("block")) {
          this.fireEvent(el, "click");
        }
      });
    if (this.options.viewportDrag) {
      viewport.call(d3.drag()
        .on("drag", () => {
          const r = this.scale.range();
          const w = parseFloat(viewport.attr("width"));
          const x = parseFloat(viewport.attr("x"));
          let newX = Math.max(x + d3.event.dx, r[0]);
          if (newX + w > r[1]) {
            newX = r[1] - w;
          }
          viewport.attr("x", newX);
        })
        .on("end", () => {
          const x1 = parseFloat(viewport.attr("x"));
          const x2 = x1 + parseFloat(viewport.attr("width"));
          const d1 = this.scale.invert(x1);
          const d2 = this.scale.invert(x2);
          this.options.viewportDrag(d1, d2);
        }));
    }
    // how the viewport is resized
    viewport.resize = function() {
      const x1 = this.scale(this.options.viewport.start);
      const x2 = this.scale(this.options.viewport.stop);
      viewport.attr("x", x1).attr("width", x2 - x1);
    }.bind(this);
    // resize once to position everything
    viewport.resize();
    return viewport;
  }

  /**
   * Positions the given element, resizes the viewer, and returns the vertical
   * center of the positioned element.
   * @param {object} e - The element to be positioned.
   * @return {number} - The vertical middle of the element after positioning.
   */
  private positionElement(e) {
    const h = e.node().getBBox().height;
    const y = parseInt(this.viewer.attr("height"), 10);
    e.attr("transform", "translate(0, " + (e.offset + y) + ")");
    this.viewer.attr("height", y + h + this.PAD);
    return y + (h / 2);
  }

  /**
   * Creates the x-axis.
   * @return {object} - D3 selection of the x-axis.
   */
  private drawXAxis() {
    // draw the axis
    const xAxis = this.viewer.append("g").attr("class", "axis");
    // add the label
    const label = this.viewer.append("text")
      .attr("class", "query")
      .text(this.data.chromosome);
    // how the axis is resized
    xAxis.resize = function() {
      // update the axis
      const axis = d3.axisTop()
        .scale(this.scale)
        .tickValues(this.scale.domain())
        .tickFormat((x, i) => x);
      xAxis.call(axis)
        .selectAll("text")
        .style("text-anchor", (t, i) => {
          if (i === 0) {
            return "start";
          }
          return "end";
        });
      const padding = this.PAD + (2 * axis.tickPadding());
      const lBox = label.node().getBBox();
      const xBox = xAxis.node().getBBox();
      xAxis.labelWidth = padding + lBox.width;
      label
        .style("text-anchor", "end")
        .attr("x", this.left - padding)
        .attr("y", xBox.height);
    }.bind(this);
    // resize once to position everything
    xAxis.resize();
    xAxis.offset = xAxis.node().getBBox().height;
    return xAxis;
  }

  /**
   * Uses the Greedy Interval Scheduling Algorithm to group track blocks.
   * @param {array} data - The blocks to be grouped.
   */
  private blocksToRows(data) {
    // create a copy so there are no side effects when sorting
    const orderedBlocks = data.slice();
    // reverse sort by stop location so we can remove elements during iteration
    orderedBlocks.sort((a, b) => b.query_stop - a.query_stop);
    // create track rows
    const rows = [];
    while (orderedBlocks.length > 0) {
      // the first block to stop will start the row
      const row = orderedBlocks.splice(orderedBlocks.length - 1, 1);
      let k = 0;
      const y = rows.length;
      row[0].y = y;
      // iteratively add blocks whose starts don"t overlap with the last stop
      for (let i = orderedBlocks.length - 1; i >= 0; i--) {
        if (orderedBlocks[i].query_start > row[k].query_stop) {
          orderedBlocks[i].y = y;
          row.push.apply(row, orderedBlocks.splice(i, 1));
          k++;
        }
      }
      rows.push(row);
    }
  }

  /**
   * Creates a graphic containing a track"s blocks.
   * @param {number} i - The index of the track in the input data to draw.
   * @return {object} - D3 selection of the new track.
   */
  private drawTrack(i) {
    const obj = this;
    const datum = this.data.tracks[i];
    const name = datum.genus + " " + datum.species;
    const c = this.options.colors(name);
    // create the track"s rows of blocks
    const blockData = datum.blocks.map((b) => Object.create(b));
    this.blocksToRows(blockData);
    // create the track
    const selector = "macro-" + i.toString();
    const track = this.viewer.append("g")
      .attr("data-macro-track", i.toString())
      .attr("data-chromosome", datum.chromosome)
      .attr("data-organism", datum.genus + " " + datum.species);
    track.offset = 0;
    // create the track"s blocks
    const publishBlockEvent = (type, block) => {
      return () => eventBus.publish({
        type,
        targets: {
          organism: name,
          block: {
            source: {
              chromosome: datum.chromosome,
              locus: [block.start, block.stop],
            },
            reference: {
              chromosome: obj.data.chromosome,
              locus: [block.query_start, block.query_stop],
            },
            orientation: block.orientation,
          }
        }
      });
    };
    const blocks = track.selectAll("block")
      .data(blockData)
      .enter()
      .append("g")
      .attr("data-locus", (b) => b.start + ":" + b.stop)
      .attr("data-reference-locus", (b) => b.query_start + ":" + b.query_stop)
      .attr("data-orientation", (b) => b.orientation)
      .style("cursor", "pointer")
      .on("mouseover", function (b) {
        obj.block = this;
        obj.setTimeout(publishBlockEvent("select", b));
      })
      .on("mouseout", function (b) {
        obj.block = undefined;
        obj.clearTimeout(publishBlockEvent("deselect", b));
      })
      .on("click", () => this.options.blockClick());
    // help for generating points
    const genPoints = (b, yTop, yBottom, yMiddle) => {
      const x1 = obj.scale(b.query_start);
      const x2 = obj.scale(b.query_stop);
      // draw a block if it"s large enough
      if (x2 - x1 > obj.PTR_LEN) {
        const p = [  // x, y coordinates of block
          x1, yTop,
          x2, yTop,
          x2, yBottom,
          x1, yBottom,
        ];
        // add the orientation pointer
        if (b.orientation === "+") {
          p[2] -= obj.PTR_LEN;
          p[4] -= obj.PTR_LEN;
          p.splice(4, 0, x2, yMiddle);
        } else if (b.orientation === "-") {
          p[0] += obj.PTR_LEN;
          p[6] += obj.PTR_LEN;
          p.push(x1, yMiddle);
        }
        return p;
      }
      // draw just a pointer
      const ptr = (b.orientation === "-") ? -obj.PTR_LEN : obj.PTR_LEN;
      return [  // x, y coordinates of block
        x1, yTop,
        x1 + ptr, yMiddle,
        x1, yBottom,
      ];
    };
    // draw the blocks
    const polygons = blocks.append("polygon")
      .attr("class", "block")
      .style("fill",  c)
      .attr("points", function(b) {
        const yTop = ((obj.BLOCK_HEIGHT + obj.PAD) * b.y) + obj.PAD;
        const yBottom = yTop + obj.BLOCK_HEIGHT;
        const yMiddle = yTop + (obj.BLOCK_HEIGHT / 2);
        const block = d3.select(this);
        d3.select(this)  // evil nested assignments!
          .attr("data-y-top", yTop)
          .attr("data-y-bottom", yBottom)
          .attr("data-y-middle", yMiddle);
        return genPoints(b, yTop, yBottom, yMiddle);
      });
    // draw the background highlight
    if (i % 2) {
      const box = track.node().getBBox();
      track.highlight = track.append("rect")
        .attr("y", obj.PAD)
        .attr("height", box.height)
        .attr("fill", "#e7e7e7")
        .moveToBack();
    }
    // draw the tooltips
    const tips = blocks.append("text")
      .attr("class", "synteny-tip")
      .attr("text-anchor", "end")
      .text((b) => b.start + " - " + b.stop)
      .attr("data-x", (b) => {
        const x1 = b.query_start;
        const x2 = b.query_stop;
        return x1 + ((x2 - x1) / 2);
      })
      .attr("data-y", (b) => (obj.BLOCK_HEIGHT + obj.PAD) * (b.y + 1))
      .attr("transform", function(b) {
        const tip = d3.select(this);
        const x = obj.scale(tip.attr("data-x"));
        const y = tip.attr("data-y");
        return "translate(" + x + ", " + y + ")";
      });
    // how the blocks are resized
    track.resize = function(polygons, tips) {
      const obj = this;
      polygons.attr("points", function(b) {
        const block = d3.select(this);
        const yTop = block.attr("data-y-top");
        const yBottom = block.attr("data-y-bottom");
        const yMiddle = block.attr("data-y-middle");
        return genPoints(b, yTop, yBottom, yMiddle);
      });
      tips.attr("transform", function(b) {
        const tip = d3.select(this);
        const o = parseInt(tip.attr("data-offset"), 10);
        const x = obj.scale(tip.attr("data-x")) + o;
        const y = parseInt(tip.attr("data-y"), 10) - o;
        return "translate(" + x + ", " + y + ") rotate(-45)";
      });
      if (track.highlight !== undefined) {
        track.highlight.attr("width", this.viewer.attr("width"));
      }
    }.bind(this, polygons, tips);
    // how tips are adjusted so they don"t overflow the view
    track.adjustTips = function(tips, resize) {
      const vRect = obj.viewer.node().getBoundingClientRect();
      tips.classed("synteny-tip", false)
        .attr("data-offset", function(b) {
          const tRect = this.getBoundingClientRect();
          const d = Math.sqrt(Math.pow(tRect.width, 2) / 2);  // rotated height
          return (tRect.bottom + d > vRect.bottom) ? d : 0;
        })
        .classed("synteny-tip", true);
      resize();
    }.bind(this, tips, track.resize);
    return track;
  }

  /**
   * Creates the y-axis, placing labels at their respective locations.
   * @param {array} ticks - The locations of the track labels.
   * @param {int} t - The pixel location of the top of the block area.
   * @param {int} b - The pixel location of the bottom of the block area.
   * @return {object} - D3 selection of the y-axis.
   */
  private drawYAxis(ticks, t, b) {
    // construct the y-axes
    const axis = d3.axisLeft()
      .scale(d3.scaleLinear().domain([t, b]).range([t, b]))
      .tickValues(ticks)
      .tickFormat((y, i) => {
        return this.data.tracks[i].chromosome;
      });
    // draw the axes of the graph
    const yAxis = this.viewer.append("g")
      .attr("class", "axis")
      .call(axis);
    const publishTrackEvent = (type, track) => {
      return () => eventBus.publish({
        type,
        targets: {
          chromosome: track.chromosome,
          organism: track.genus + " " + track.species,
        }
      });
    };
    yAxis.selectAll("text")
      .attr("class", (y, i) => {
        let cls = "macro-" + i.toString();
        if (this.options.highlight.indexOf(this.data.tracks[i].chromosome) !== -1) {
          cls += " bold";
        }
        return cls;
      })
      .attr("data-macro-track", (y, i) => i.toString())
      .attr("data-chromosome", (y, i) => this.data.tracks[i].chromosome)
      .attr("data-organism", (y, i) => this.data.tracks[i].genus + " " + this.data.tracks[i].species)
      .style("cursor", "pointer")
      .on("mouseover", (y, i) => this.setTimeout(publishTrackEvent("select", this.data.tracks[i])))
      .on("mouseout", (y, i) => this.clearTimeout(publishTrackEvent("deselect", this.data.tracks[i])))
      .on("click", () => this.options.nameClick());
    return yAxis;
  }

  /**
   * Gets the element under the element currently under mouse pointer.
   * @input {MouseEvent} e - The mouse event used to find the elements.
   * @output {HTMLElement} - The elements under the element current under the
   * mouse pointer.
   */
  private secondElementUnderPointer(e) {
    const x = e.clientX;
    const y = e.clientY;
    const stack = [];
    // find the elements
    const first = document.elementFromPoint(x, y);
    first.classList.add("pointer-events-none");
    const second = document.elementFromPoint(x, y);
    // reset pointer-events
    first.classList.remove("pointer-events-none");
    return second;
  }

  /**
   * Fires the given event on the given element.
   * @input {HTMLElement} el - The element to fire the event on.
   * @input {string} e - The event to be fired on the element.
   */
  private fireEvent(el, e) {
    if (el.fireEvent) {
      el.fireEvent("on" + e);
    } else {
      const eObj = document.createEvent("Events");
      eObj.initEvent(e, true, false);
      el.dispatchEvent(eObj);
    }
  }

  /**
   * Programmatically triggers hover events by assuming the given element
   * is being hovered and considering the last known element being hovered.
   * @input{HTMLElement} el - The element to consider.
   */
  private artificialHover(el) {
    if (this.block !== undefined && this.block !== el) {
      this.fireEvent(this.block, "mouseout");
    }
    if (el.classList.contains("block") && el !== this.block) {
      this.fireEvent(el, "mouseover");
    }
  }
}
