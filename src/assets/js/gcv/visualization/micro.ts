import { d3 } from './d3';
import { eventBus } from '../common';
import { Visualizer } from './visualizer';
import {
  columnDomain,
  glyphRotation,
  glyphShape,
  neighborDistances,
  railOffsets,
  trackInterval,
  trackLabel,
  trackLevels,
  trackTicks,
} from './layout/micro-tracks';

type Box = { x: number; y: number; width: number; height: number };

// what the viewer drew where, in viewport CSS pixels: each consensus
// column's center, and each track's first row (y), extent and label
export type MicroLayout = {
  svg: Box;
  glyphSize: number;
  columns: { column: number; x: number }[];
  tracks: {
    index: number;
    y: number;
    top: number;
    height: number;
    label: Box | null;
  }[];
};

/** The micro-synteny viewer. */
export class Micro extends Visualizer {
  // Private
  private distances: any[];
  private left: number;
  private names: any[];
  private intervals: any[];
  private levels: number[];
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
    this.viewer.attr('width', w);
  }

  /** Handles events that come from the GCV eventBus.
   * @param {GCVevent} event - A GCV event containing a type and targets attributes.
   */
  protected eventHandler(event) {
    // select the relevant elements in the viewer
    let selection;
    if (Object.prototype.hasOwnProperty.call(event.targets, 'block')) {
      /* noop */
    } else if (Object.prototype.hasOwnProperty.call(event.targets, 'genes')) {
      const selectors = event.targets.genes.map(
        (g) => "[data-gene='" + g + "']",
      );
      const selector = selectors.join(',');
      selection = this.viewer.selectAll(selector);
    } else if (Object.prototype.hasOwnProperty.call(event.targets, 'family')) {
      const selectors = [];
      event.targets.family.split(',').forEach((f) => {
        selectors.push("[data-family='" + f + "']");
      });
      selection = this.viewer.selectAll(selectors.join(', '));
    } else if (
      Object.prototype.hasOwnProperty.call(event.targets, 'chromosome')
    ) {
      let selector = "[data-chromosome='" + event.targets.chromosome + "']";
      if (Object.prototype.hasOwnProperty.call(event.targets, 'extent')) {
        selector += "[data-extent='" + event.targets.extent.join(':') + "']";
      }
      selection = this.viewer.selectAll(selector);
    } else if (
      Object.prototype.hasOwnProperty.call(event.targets, 'organism')
    ) {
      const selector = "[data-organism='" + event.targets.organism + "']";
      selection = this.viewer.selectAll(selector);
    }
    // (un)fade the (un)selected elements
    switch (event.type) {
      case 'select':
        this.viewer.classed('hovering', true);
        if (selection !== undefined) {
          selection.classed('active', true);
        }
        break;
      case 'deselect':
        if (selection !== undefined) {
          selection.classed('active', false);
        }
        this.viewer.classed('hovering', false);
        break;
    }
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
    this.eventBus = eventBus.subscribe(this.eventHandler.bind(this));
    this.GLYPH_SIZE = 30;
    // parse optional parameters
    this.options = Object.assign({}, options);
    this.options.bold = this.options.bold || [];
    this.options.highlight = this.options.highlight || [];
    this.options.nameClick =
      this.options.nameClick ||
      ((t, i) => {
        /* noop */
      });
    this.options.geneClick =
      this.options.geneClick ||
      ((t, g) => {
        /* noop */
      });
    this.options.geneOver =
      this.options.geneOver ||
      ((e, t, g) => {
        /* noop */
      });
    this.options.autoResize = this.options.autoResize || false;
    this.options.hoverDelay = this.options.hoverDelay || 500;
    this.options.prefix = this.options.prefix || ((t) => '');
    // create the viewer
    const levels = trackLevels(data);
    this.levels = levels;
    const numLevels = levels.reduce((a, b) => a + b, 0);
    const halfTrack = this.GLYPH_SIZE / 2;
    const top = this.PAD + halfTrack;
    const bottom = top + this.GLYPH_SIZE * numLevels;
    this.viewer.attr('height', bottom + halfTrack);
    // compute the track names and locations, and line thickness
    this.ticks = trackTicks(levels);
    this.names = data.map((t) => trackLabel(t, this.options.prefix(t)));
    this.intervals = data.map(trackInterval);
    this.distances = data.map(neighborDistances);
    const allDistances = this.distances.flat();
    const minDistance = Math.min(Infinity, ...allDistances);
    const maxDistance = Math.max(-Infinity, ...allDistances);
    // initialize the x, y, and line thickness scales
    this.x = d3.scaleLinear().domain(columnDomain(data));
    this.y = d3
      .scaleLinear()
      .domain([0, numLevels - 1])
      .range([top, bottom]);
    this.thickness = d3
      .scaleLinear()
      .domain([minDistance, maxDistance])
      .range([0.1, 5]);
    this.right = this.PAD;
    super.initResize();
  }

  /** Draws the viewer. */
  protected draw() {
    // draw the y-axes
    const yAxis = this.drawYAxis();
    const resizeYaxis = () => {
      this.left = yAxis.node().getBBox().width + this.PAD;
      yAxis.attr('transform', 'translate(' + this.left + ', 0)');
      this.left += this.PAD;
    };
    resizeYaxis();
    this.decorateResize(resizeYaxis);
    const setRight = () => (this.right = this.PAD);
    setRight();
    this.decorateResize(setRight);
    if (this.options.plotClick !== undefined) {
      const plotAxis = this.drawPlotAxis();
      const resizePlotYAxis = () => {
        this.right += plotAxis.node().getBBox().width + this.PAD;
        const x = this.viewer.attr('width') - this.right + this.PAD;
        plotAxis.attr('transform', 'translate(' + x + ', 0)');
      };
      resizePlotYAxis();
      this.decorateResize(resizePlotYAxis);
    }
    // draw the tracks
    const setXrange = () => {
      const w = this.container.clientWidth;
      const halfGlyph = this.GLYPH_SIZE / 2;
      const r1 = this.left + halfGlyph;
      const r2 = w - (this.right + halfGlyph);
      this.x.range([r1, r2]);
    };
    setXrange();
    this.decorateResize(setXrange);
    const tracks = [];
    for (let i = 0; i < this.data.length; i++) {
      // make the track and save it for the resize call
      tracks.push(this.drawTrack(i).moveToBack());
    }
    // decorate the resize function with that of the track
    const resizeTracks = () => {
      tracks.forEach((t, i) => {
        t.resize();
      });
    };
    resizeTracks();
    this.decorateResize(resizeTracks);
    // create an auto resize listener, if necessary
    if (this.options.autoResize) {
      this.autoResize();
    }
  }

  // Public

  /**
   * Where the viewer drew its columns, tracks and labels, in the
   * page's viewport coordinates (CSS pixels), as getBoundingClientRect
   * reports them, so they match a screenshot of the page.
   */
  layout(): MicroLayout {
    const rect = (e: Element): Box => {
      const r = e.getBoundingClientRect();
      return { x: r.left, y: r.top, width: r.width, height: r.height };
    };
    const svg = this.viewer.node() as SVGSVGElement;
    const box = svg.getBoundingClientRect();
    const half = this.GLYPH_SIZE / 2;
    const [from, to] = this.x.domain();
    const columns: MicroLayout['columns'] = [];
    for (let c = Math.ceil(from); c <= Math.floor(to); c++) {
      columns.push({ column: c, x: box.left + this.x(c) });
    }
    const labels = new Map<number, Element>();
    this.viewer.selectAll('.axis text[data-micro-track]').each(function () {
      labels.set(Number(this.getAttribute('data-micro-track')), this);
    });
    const tracks = this.data.map((_, i) => {
      const top = this.y(this.ticks[i]) - half;
      const bottom = this.y(this.ticks[i] + this.levels[i] - 1) + half;
      return {
        index: i,
        y: box.top + this.y(this.ticks[i]),
        top: box.top + top,
        height: bottom - top,
        label: labels.has(i) ? rect(labels.get(i)) : null,
      };
    });
    return {
      svg: rect(svg),
      glyphSize: this.GLYPH_SIZE,
      columns,
      tracks,
    };
  }

  /** Makes a copy of the SVG and inlines external GCV styles. */
  protected inlineCopy() {
    return super.inlineCopy((clone) => {
      clone.select('.plot-axis').remove();
    });
  }

  /**
   * Creates a graphic containing a track"s genes.
   * @param {number} i - The index of the track in the input data to draw.
   * @return {object} - D3 selection of the new track.
   */
  private drawTrack(i) {
    const obj = this;
    const t = this.data[i];
    const y = this.ticks[i];
    // make svg group for the track
    const track = this.viewer
      .append('g')
      .attr('data-micro-track', i.toString())
      .attr('data-extent', this.intervals[i].join(':'))
      .attr('data-chromosome', t.chromosome_name)
      .attr('data-organism', t.genus + ' ' + t.species);
    const neighbors = [];
    const railHeight = (n) => Math.abs(obj.y(n.a.y) - obj.y(n.b.y));
    // add the lines
    for (let j = 0; j < t.genes.length - 1; j++) {
      neighbors.push({ a: t.genes[j], b: t.genes[j + 1] });
    }
    const lineGroups = track
      .selectAll('rail')
      .data(neighbors)
      .enter()
      .append('g')
      .attr('class', 'rail');
    // draw lines left to right to simplify resizing
    const lines = lineGroups
      .append('line')
      .attr('class', 'line')
      .attr('stroke-width', (n, j) => {
        return obj.thickness(obj.distances[i][j]);
      })
      .attr('x1', 0)
      .attr('y1', (n) => railOffsets(n.a, n.b, railHeight(n))[0])
      .attr('y2', (n) => railOffsets(n.a, n.b, railHeight(n))[1]);
    // make the gene groups
    const publishGeneEvent = (type, gene) => {
      return () =>
        eventBus.publish({
          type,
          targets: {
            genes: [gene.name],
            family: gene.family,
          },
        });
    };
    const geneGroups = track
      .selectAll('gene')
      .data(t.genes)
      .enter()
      .append('g')
      .attr('class', 'gene')
      .attr('data-gene', (g) => g.name)
      .attr('data-family', (g) => g.family)
      .attr('data-column', (g) => g.x)
      .attr('transform', (g) => {
        return 'translate(' + obj.x(g.x) + ', ' + obj.y(y + g.y) + ')';
      })
      .style('cursor', 'pointer')
      .on('mouseover', (event, g) => {
        this.setTimeout(() => {
          publishGeneEvent('select', g)();
          this.options.geneOver(event, t, g);
        });
      })
      .on('mouseout', (event, g) =>
        this.clearTimeout(publishGeneEvent('deselect', g)),
      )
      .on('click', (event, g) => obj.options.geneClick(t, g))
      // add optional HTML attributes to gene elements
      .addHTMLAttributes();
    // add genes to the gene groups
    geneGroups
      .append('path')
      .attr('d', (g) =>
        glyphShape(g) === 'circle'
          ? d3.symbol().type(d3.symbolCircle).size(50)()
          : d3.symbol().type(d3.symbolTriangle).size(200)(),
      )
      .attr('class', (g) => {
        let c = 'point';
        if (obj.options.highlight.indexOf(g.name) !== -1) {
          c += ' focus';
        }
        if (g.family === '') {
          c += ' no_fam';
        } else if (
          obj.options.selectiveColoring !== undefined &&
          obj.options.selectiveColoring[g.family] === 1
        ) {
          c += ' single';
        }
        return c;
      })
      .attr('transform', (g) => `rotate(${glyphRotation(g)})`)
      .style('fill', (g) => {
        if (
          g.family === '' ||
          (obj.options.selectiveColoring !== undefined &&
            obj.options.selectiveColoring[g.family] === 1)
        ) {
          return '#ffffff';
        }
        return obj.colors(g.family);
      });
    // draw the background highlight
    if (i % 2) {
      track.highlight = track
        .append('rect')
        .attr('fill', '#e7e7e7')
        .moveToBack();
    }
    // how the track is resized
    track.resize = function (geneGroups, linesGroups, lines) {
      const obj = this;
      geneGroups.attr('transform', (g) => {
        return 'translate(' + obj.x(g.x) + ', ' + obj.y(y + g.y) + ')';
      });
      lineGroups.attr('transform', (n) => {
        const left = Math.min(n.a.x, n.b.x);
        const top = y + Math.min(n.a.y, n.b.y);
        return 'translate(' + obj.x(left) + ', ' + obj.y(top) + ')';
      });
      lines.attr('x2', (n) => Math.abs(obj.x(n.a.x) - obj.x(n.b.x)));
      if (track.highlight !== undefined) {
        const highY = obj.y(y) + geneGroups.node().getBBox().y;
        const height = track.node().getBBox().height;
        track.highlight
          .attr('width', obj.viewer.attr('width'))
          .attr('y', highY)
          .attr('height', height);
      }
    }.bind(this, geneGroups, lineGroups, lines);
    return track;
  }

  /**
   * Creates the y-axis, placing labels at their respective locations.
   * @return {object} - D3 selection of the y-axis.
   */
  private drawYAxis() {
    // construct the y-axes
    const axis = d3
      .axisLeft(this.y)
      //.orient("left")
      .tickValues(this.ticks)
      .tickFormat((y, i) => this.names[i]);
    // draw the axes of the graph
    const yAxis = this.viewer.append('g').attr('class', 'axis').call(axis);
    const publishTrackEvent = (type, i) => {
      const track = this.data[i];
      const interval = this.intervals[i];
      return () =>
        eventBus.publish({
          type,
          targets: {
            genes: track.genes.map((g) => g.name),
            extent: interval,
            chromosome: track.chromosome_name,
            organism: track.genus + ' ' + track.species,
          },
        });
    };
    const obj = this;
    yAxis
      .selectAll('text')
      .attr('class', (y, i) => {
        if (this.options.bold.indexOf(this.data[i]) !== -1) {
          return 'query';
        }
        return '';
      })
      .attr('data-micro-track', (y, i) => i.toString())
      .attr('data-extent', (y, i) => this.intervals[i].join(':'))
      .attr('data-chromosome', (y, i) => this.data[i].chromosome_name)
      .attr(
        'data-organism',
        (y, i) => this.data[i].genus + ' ' + this.data[i].species,
      )
      .style('cursor', 'pointer')
      .on('mouseover', (event, y) => {
        const i = this.ticks.indexOf(y);
        this.setTimeout(publishTrackEvent('select', i));
      })
      .on('mouseout', (event, y) => {
        const i = this.ticks.indexOf(y);
        this.clearTimeout(publishTrackEvent('deselect', i));
      })
      .on('click', (event, y) => {
        const i = this.ticks.indexOf(y);
        this.options.nameClick(this.data[i], i);
      })
      // add optional HTML attributes to gene elements
      //.addHTMLAttributes();
      .each(function (y, i) {
        const selection: any = d3.select(this);
        selection.addHTMLAttributes(obj.data[i]);
      });
    return yAxis;
  }

  /**
   * Creates the plot y-axis, placing labels at their respective locations.
   * @return {object} - D3 selection of the plot y-axis.
   */
  private drawPlotAxis() {
    // construct the plot y-axes
    const axis = d3
      .axisRight(this.y)
      //.orient("right")
      .tickValues(this.ticks)
      .tickFormat((y, i) => 'plot');
    // draw the axes of the graph
    const plotYAxis = this.viewer
      .append('g')
      .attr('class', 'axis plot-axis')
      .call(axis);
    plotYAxis
      .selectAll('text')
      .attr('class', 'micro-plot-link')
      .style('cursor', 'pointer')
      .on('click', (event, y) => {
        const i = this.ticks.indexOf(y);
        this.options.plotClick(event, this.data[i], i);
      });
    return plotYAxis;
  }
}
