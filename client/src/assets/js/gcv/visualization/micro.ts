import { d3 } from "./d3";
import { Visualizer } from "./visualizer";

/** The micro-synteny viewer. */
export class Micro extends Visualizer {

  // Private
  private distances: any[];
  private left: number;
  private names: any[];
  private right: number;
  private thickness: any;
  private ticks: any[];
  private x: any;
  private y: any;

  // Constants
  private GLYPH_SIZE: number;

  /** Resizes the viewer and x scale. Will be decorated by other components. */
  protected resize() {
    const w = this.container.clientWidth;
    const doublePad = 2 * this.PAD;
    const halfGlyph = this.GLYPH_SIZE / 2;
    const r1 = this.left + halfGlyph;
    const r2 = w - (this.right + halfGlyph);
    this.viewer.attr("width", w);
    this.x.range([r1, r2]);
  }

  /**
   * Parses parameters and initializes letiables.
   * @param {HTMLElement|string} el - ID of or the element itself where the
   * viewer will be drawn in.
   * @param {object} colors - D3 family-to-color map.
   * @param {object} data - The data the viewer will visualize.
   * @param {object} options - Optional parameters.
   */
  protected init(el, colors, data, options) {
    super.init(el, colors, data);
    this.GLYPH_SIZE = 30;
    // parse optional parameters
    this.options = Object.assign({}, options);
    this.options.boldFirst = this.options.boldFirst || false;
    this.options.highlight = this.options.highlight || [];
    this.options.selectiveColoring = this.options.selectiveColoring;
    this.options.nameClick = this.options.nameClick || ((y, i) => { /* noop */ });
    this.options.geneClick = this.options.geneClick || ((b) => { /* noop */ });
    this.options.plotClick = this.options.plotClick;
    this.options.autoResize = this.options.autoResize || false;
    this.options.hoverDelay = this.options.hoverDelay || 500;
    this.options.prefix = this.options.prefix || ((t) => "");
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
    // create the viewer
    const levels = data.groups.map((group) => {
      return Math.max.apply(null, group.genes.map((gene) => gene.y)) + 1;
    });
    const numLevels = levels.reduce((a, b) => a + b, 0);
    const halfTrack = this.GLYPH_SIZE / 2;
    const top = this.PAD + halfTrack;
    const bottom = top + (this.GLYPH_SIZE * numLevels);
    this.viewer.attr("height", bottom + halfTrack);
    // compute the x scale, track names and locations, and line thickness
    let minX = Infinity;
    let maxX = -Infinity;
    let minDistance = Infinity;
    let maxDistance = -Infinity;
    this.names = [];
    this.ticks = [];
    let tick = 0;
    this.distances = [];
    for (let i = 0; i < this.data.groups.length; i++) {
      const group = this.data.groups[i];
      let fminI = Infinity;
      let fmaxI = -Infinity;
      this.ticks.push(tick);
      tick += levels[i];
      const distances = [];
      for (let j = 0; j < group.genes.length; j++) {
        const gene = group.genes[j];
        const fmax = gene.fmax;
        const fmin = gene.fmin;
        const x = gene.x;
        fminI = Math.min.apply(null, [fminI, fmax, fmin]);
        fmaxI = Math.max.apply(null, [fmaxI, fmax, fmin]);
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        if (j < group.genes.length - 1) {
          const nextGene = group.genes[j + 1];
          const nextFmin = nextGene.fmin;
          const nextFmax = nextGene.fmax;
          const dist = Math.min.apply(null, [
            Math.abs(fmin - nextFmin),
            Math.abs(fmax - nextFmin),
            Math.abs(fmin - nextFmax),
            Math.abs(fmax - nextFmin),
          ]);
          distances.push(dist);
          minDistance = Math.min(minDistance, dist);
          maxDistance = Math.max(maxDistance, dist);
        }
      }
      this.names.push(this.options.prefix(group) + group.chromosome_name + ":" + fminI + "-" + fmaxI);
      this.distances.push(distances);
    }
    // initialize the x, y, and line thickness scales
    this.x = d3.scaleLinear().domain([minX, maxX]);
    this.y = d3.scaleLinear().domain([0, numLevels - 1])
               .range([top, bottom]);
    this.thickness = d3.scaleLinear()
      .domain([minDistance, maxDistance])
      .range([.1, 5]);
    this.right = this.PAD;
    super.initResize();
  }

  /** Draws the viewer. */
  protected draw() {
    // draw the y-axes
    const yAxis = this.drawYAxis();
    this.left = yAxis.node().getBBox().width + this.PAD;
    yAxis.attr("transform", "translate(" + this.left + ", 0)");
    this.left += this.PAD;
    if (this.options.plotClick !== undefined) {
      const plotAxis = this.drawPlotAxis();
      this.right += plotAxis.node().getBBox().width + this.PAD;
      const obj = this;
      const resizePlotYAxis = () => {
        const x = obj.viewer.attr("width") - obj.right + obj.PAD;
        plotAxis.attr("transform", "translate(" + x + ", 0)");
      };
      this.decorateResize(resizePlotYAxis);
    }
    this.resize();
    // draw the tracks
    const tracks = [];
    for (let i = 0; i < this.data.groups.length; i++) {
      // make the track and save it for the resize call
      tracks.push(this.drawTrack(i).moveToBack());
    }
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
    // create an auto resize iframe, if necessary
    if (this.options.autoResize) {
      this.resizer = this.autoResize(this.container, (e) => {
        this.resize();
      });
    }
    this.resize();
  }

  // Public

  /** Makes a copy of the SVG and inlines external GCV styles. */
  protected inlineCopy() {
    return super.inlineCopy((clone) => {
      clone.select(".plot-axis").remove();
    });
  }

  /**
   * Creates a graphic containing a track"s genes.
   * @param {number} i - The index of the track in the input data to draw.
   * @return {object} - D3 selection of the new track.
   */
  private drawTrack(i) {
    const obj = this;
    const t = this.data.groups[i];
    const y = this.ticks[i];
    // make svg group for the track
    const track = this.viewer.append("g")
          .attr("data-micro-track", i.toString())
          .attr("data-chromosome", t.chromosome_name)
          .attr("data-genus-species", t.genus + " " + t.species);
    const neighbors = [];
    // add the lines
    for (let j = 0; j < t.genes.length - 1; j++) {
      neighbors.push({a: t.genes[j], b: t.genes[j + 1]});
    }
    const lineGroups = track.selectAll("rail")
      .data(neighbors)
      .enter()
      .append("g")
      .attr("class", "rail");
    // draw lines left to right to simplify resizing
    const lines = lineGroups.append("line")
      .attr("class", "line")
      .attr("stroke-width", (n, j) => {
        return obj.thickness(obj.distances[i][j]);
      })
      .attr("x1", 0)
      .attr("y1", (n) => {
        const height = Math.abs(obj.y(n.a.y) - obj.y(n.b.y));
        if (n.a.x <= n.b.x) {
          return (n.a.y < n.b.y) ? 0 : height;
        }
        return (n.a.y < n.b.y) ? height : 0;
      })
      .attr("y2", (n) => {
        const height = Math.abs(obj.y(n.a.y) - obj.y(n.b.y));
        if (n.a.x <= n.b.x) {
          return (n.a.y < n.b.y) ? height : 0;
        }
        return (n.a.y < n.b.y) ? 0 : height;
      });
    // add tooltips to the lines
    const lineTips = lineGroups.append("text")
      .attr("class", "synteny-tip")
      .attr("text-anchor", "end")
      .text((n, j) => obj.distances[i][j]);
    // make the gene groups
    const geneGroups = track.selectAll("gene")
      .data(t.genes)
      .enter()
      .append("g")
      .attr("class", "gene")
      .attr("data-gene", (g) => g.id)
      .attr("data-family", (g) => g.family)
      .attr("transform", (g) => {
        return "translate(" + obj.x(g.x) + ", " + obj.y(y + g.y) + ")";
      })
      .style("cursor", "pointer")
      .on("mouseover", (g) => {
        const id = g.id.toString();
        const gene = ".GCV [data-gene='" + id + "']";
        const family = ".GCV [data-family='" + g.family + "']";
        const selection = d3.selectAll(gene + ", " + family)
          .filter(function() {
            const d = this.getAttribute("data-gene");
            return d === null || d === id;
          });
        obj.beginHover(selection);
      })
      .on("mouseout", (g) => {
        const id = g.id.toString();
        const gene = ".GCV [data-gene='" + id + "']";
        const family = ".GCV [data-family='" + g.family + "']";
        const selection = d3.selectAll(gene + ", " + family)
          .filter(function() {
            const d = this.getAttribute("data-gene");
            return d === null || d === id;
          });
        obj.endHover(selection);
      })
      .on("click", (g) => obj.options.geneClick(g, t));
    // add genes to the gene groups
    const genes = geneGroups.append("path")
      .attr("d", d3.symbol().type(d3.symbolTriangle).size(200))
      .attr("class", (g) => {
        if (obj.options.highlight.indexOf(g.name) !== -1) {
          return "point focus";
        } else if (g.family === "") {
          return "point no_fam";
        } else if (obj.options.selectiveColoring !== undefined &&
        obj.options.selectiveColoring[g.family] === 1) {
          return "point single";
        }
        return "point";
      })
      .attr("transform", (g) => {
        let sign = "";
        if ((g.strand === -1 && !g.reversed) || (g.strand === 1 && g.reversed)) {
          sign = "-";
        }
        return "rotate(" + sign + "90)";
      })
      .style("fill", (g) => {
        if (g.family === "" ||
        (obj.options.selectiveColoring !== undefined &&
        obj.options.selectiveColoring[g.family] === 1)) {
          return "#ffffff";
        }
        return obj.colors(g.family);
      });
    // draw the background highlight
    if (i % 2) {
      const highY = obj.y(y) + genes.node().getBBox().y;
      const height = track.node().getBBox().height - highY;
      track.highlight = track.append("rect")
        .attr("y", highY)
        .attr("height", height)
        .attr("fill", "#e7e7e7")
        .moveToBack();
    }
    // add tooltips to the gene groups
    const geneTips = geneGroups.append("text")
      .attr("class", "synteny-tip")
      .attr("text-anchor", "end")
      .text((g) => g.name + ": " + g.fmin + " - " + g.fmax);
    // how the track is resized
    track.resize = function(geneGroups, linesGroups, lines, lineTips) {
      const obj = this;
      geneGroups.attr("transform", (g) => {
        return "translate(" + obj.x(g.x) + ", " + obj.y(y + g.y) + ")";
      });
      lineGroups.attr("transform", (n) => {
        const left = Math.min(n.a.x, n.b.x);
        const top = y + Math.min(n.a.y, n.b.y);
        return "translate(" + obj.x(left) + ", " + obj.y(top) + ")";
      });
      lines.attr("x2", (n) => Math.abs(obj.x(n.a.x) - obj.x(n.b.x)));
      //lineTips.attr("transform", function(n) {
      //  const x = Math.abs(obj.x(n.a.x) - obj.x(n.b.x)) / 2;
      //  const y = Math.abs(obj.y(n.a.y) - obj.y(n.b.y)) / 2;
      //  //// awkward syntax FTW
      //  //const transform = d3.transform(d3.select(this).attr("transform"));
      //  //transform.translate = [x, y];
      //  //return transform;
      //  const t1 = "translate(0, 0)";
      //  const t2 = "translate(" + x + ", " + y + ")";
      //  return d3.interpolateTransformSvg(t1, t2);
      //});
      if (track.highlight !== undefined) {
        track.highlight.attr("width", this.viewer.attr("width"));
      }
    }.bind(this, geneGroups, lineGroups, lines, lineTips);
    // how tips are rotated so they don"t overflow the view
    const tips = track.selectAll(".synteny-tip");
    track.adjustTips = function(tips, resize) {
      const vRect = obj.viewer.node().getBoundingClientRect();
      tips.classed("synteny-tip", false)
        .attr("transform", function(t) {
          const tRect = this.getBoundingClientRect();
          const h = Math.sqrt(Math.pow(tRect.width, 2) / 2);  // rotated height
          const o = (tRect.bottom + h > vRect.bottom) ? h : 0;
          return "translate(" + o + ", " + (-o) + ") rotate(-45)";
        })
        .classed("synteny-tip", true);
      resize();
    }.bind(this, tips, track.resize);
    return track;
  }

  /**
   * Creates the y-axis, placing labels at their respective locations.
   * @return {object} - D3 selection of the y-axis.
   */
  private drawYAxis() {
    // construct the y-axes
    const axis = d3.axisLeft(this.y)
      //.orient("left")
      .tickValues(this.ticks)
      .tickFormat((y, i) => this.names[i]);
    // draw the axes of the graph
    const yAxis = this.viewer.append("g")
      .attr("class", "axis")
      .call(axis);
    yAxis.selectAll("text")
      .attr("class", (y, i) => {
        return (i === 0 && this.options.boldFirst) ? "query " : "";
      })
      .attr("data-micro-track", (y, i) => i.toString())
      .attr("data-chromosome", (y, i) => this.data.groups[i].chromosome_name)
      .style("cursor", "pointer")
      .on("mouseover", (y, i) => {
        const iStr = i.toString();
        const micro = ".GCV [data-micro-track='" + iStr + "']";
        const name = this.data.groups[i].chromosome_name;
        const chromosome = ".GCV [data-chromosome='" + name + "'], " +
                           ".GCV .cs-layout [class~='" + name + "']";  // Circos.js
        const organism = this.data.groups[i].genus + " " + this.data.groups[i].species;
        const genusSpecies = ".GCV .legend[data-genus-species='" + organism + "']";
        const selection = d3.selectAll(micro + ", " + chromosome + ", " + genusSpecies)
          .filter(function() {
            const t = this.getAttribute("data-micro-track");
            return t === null || t === iStr;
          });
        this.beginHover(selection);
      })
      .on("mouseout", (y, i) => {
        const iStr = i.toString();
        const micro = ".GCV [data-micro-track='" + iStr + "']";
        const name = this.data.groups[i].chromosome_name;
        const chromosome = ".GCV [data-chromosome='" + name + "'], " +
                           ".GCV .cs-layout [class~='" + name + "']";  // Circos.js
        const organism = this.data.groups[i].genus + " " + this.data.groups[i].species;
        const genusSpecies = ".GCV .legend[data-genus-species='" + organism + "']";
        const selection = d3.selectAll(micro + ", " + chromosome + ", " + genusSpecies)
          .filter(function() {
            const t = this.getAttribute("data-micro-track");
            return t === null || t === iStr;
          });
        this.endHover(selection);
      })
      .on("click", (y, i) => {
        this.options.nameClick(this.data.groups[i]);
      });
    return yAxis;
  }

  /**
   * Creates the plot y-axis, placing labels at their respective locations.
   * @return {object} - D3 selection of the plot y-axis.
   */
  private drawPlotAxis() {
    // construct the plot y-axes
    const axis = d3.axisRight(this.y)
      //.orient("right")
      .tickValues(this.ticks)
      .tickFormat("plot");
    // draw the axes of the graph
    const plotYAxis = this.viewer.append("g")
      .attr("class", "axis plot-axis")
      .call(axis);
    plotYAxis.selectAll("text")
      .style("cursor", "pointer")
      .on("click", (y, i) => {
        this.options.plotClick(this.data.groups[i]);
      });
    return plotYAxis;
  }
}
