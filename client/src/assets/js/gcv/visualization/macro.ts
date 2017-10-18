import { d3 }         from './d3';
import { Visualizer } from './visualizer';


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

  /** Resizes the viewer and scale. Will be decorated by other components. */
  protected resize() {
    var w = this.container.clientWidth,
        r1 = this.left + (2 * this.PAD),
        r2 = w - (this.right + this.PAD);
    this.viewer.attr('width', w);
    this.scale.range([r1, r2]);
  }

  /**
    * Parses parameters and initializes variables.
    * @param {HTMLElement|string} el - ID of or the element itself where the
    * viewer will be drawn in.
    * @param {object} data - The data the viewer will visualize.
    * @param {object} options - Optional parameters.
    */
  protected init(el, data, colors, options) {
    super.init(el, colors, data);
    this.viewer.attr('height', this.PAD);
    this.BLOCK_HEIGHT = 11;
    this.PTR_LEN      = 5;
    // compute the space required for chromosome names
		var chromosomes = data.tracks.map(function (t) { return t.chromosome; });
    this.left = 0;
    this.right = this.PAD;
    // create the scale used to map block coordinates to pixels
    this.scale = d3.scale.linear()
      .domain([0, data.length]);
    super.initResize();
    // parse optional parameters
    this.options = Object.assign({}, options);
    this.options.nameClick = this.options.nameClick || function (y, i) { };
    this.options.blockClick = this.options.blockClick || function (b) { };
    this.options.viewportDrag = this.options.viewportDrag;
    this.options.viewport = this.options.viewport || false;
    this.options.autoResize = this.options.autoResize || false;
    this.options.hoverDelay = this.options.hoverDelay || 500;
    this.options.highlight = this.options.highlight || [];
    if (this.options.contextmenu)
      this.viewer.on('contextmenu', () => {
        this.options.contextmenu(d3.event);
      });
    if (this.options.click)
      this.viewer.on('click', () => {
        this.options.click(d3.event);
      });
  }

  /**
    * Positions the given element, resizes the viewer, and returns the vertical
    * center of the positioned element.
    * @param {object} e - The element to be positioned.
    * @return {number} - The vertical middle of the element after positioning.
    */
  private positionElement(e) {
    var h = e.node().getBBox().height,
        y = parseInt(this.viewer.attr('height'));
    e.attr('transform', 'translate(0, ' + (e.offset + y) + ')');
    this.viewer.attr('height', y + h + this.PAD);
    return y + (h / 2);
  }

  /**
    * Creates the x-axis.
    * @return {object} - D3 selection of the x-axis.
    */
  private drawXAxis() {
    // draw the axis
    var xAxis = this.viewer.append('g').attr('class', 'axis');
    // add the label
    var label = xAxis.append('text')
      .attr('class', 'query')
      .text(this.data.chromosome);
    // how the axis is resized
    xAxis.resize = function () {
      // update the axis
      var axis = d3.svg.axis()
        .scale(this.scale)
        .orient('top')
        .tickValues(this.scale.domain())
        .tickFormat((x, i) => { return x; });
      xAxis.call(axis)
        .selectAll('text')
        .style('text-anchor', function (t, i) {
          if (i == 1) {
            return 'start';
          } return 'end';
        });
      var padding = this.PAD + (2 * axis.tickPadding()),
          lBox = label.node().getBBox();
      xAxis.labelWidth = padding + lBox.width;
      label.style('text-anchor', 'end').attr('transform', (b) => {
        var x = this.left - padding,
            y = -(lBox.height / 2);
        return 'translate(' + x + ', ' + y + ')';
      });
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
    var orderedBlocks = data.slice();
    // reverse sort by stop location so we can remove elements during iteration
    orderedBlocks.sort(function (a, b) { return b.stop - a.stop; });
    // create track rows
    var rows = [];
    while (orderedBlocks.length > 0) {
      // the first block to stop will start the row
      var row = orderedBlocks.splice(orderedBlocks.length - 1, 1),
          k = 0,
          y = rows.length;
      row[0].y = y;
      // iteratively add blocks whose starts don't overlap with the last stop
      for (var i = orderedBlocks.length - 1; i >= 0; i--) {
        if (orderedBlocks[i].start > row[k].stop) {
          orderedBlocks[i].y = y;
          row.push.apply(row, orderedBlocks.splice(i, 1));
          k++;
        }
      }
      rows.push(row);
    }
  }

  /**
    * Creates a graphic containing a track's blocks.
    * @param {number} i - The index of the track in the input data to draw.
    * @return {object} - D3 selection of the new track.
    */
  private drawTrack(i) {
    var obj = this,
        datum = this.data.tracks[i],
        name = datum.genus + ' ' + datum.species,
        c = this.options.colors(name);
    // create the track's rows of blocks
    this.blocksToRows(datum.blocks);
  	// create the track
    var selector = 'macro-' + i.toString(),
  	    track = this.viewer.append('g')
          .attr('data-macro-track', i.toString())
          .attr('data-chromosome', datum.chromosome)
          .attr('data-genus-species', datum.genus + ' ' + datum.species);
    track.offset = 0;
    // create the track's blocks
    var blocks = track.selectAll('block')
  	  .data(datum.blocks)
  	  .enter()
      .append('g')
  	  .style('cursor', 'pointer')
      .on('mouseover', function (b) {
        obj.block = this;
        obj.beginHover(d3.select(this));
      })
  	  .on('mouseout', function (b) {
        obj.block = undefined;
        obj.endHover(d3.select(this));
      })
  	  .on('click', () => { this.options.blockClick(); });
    // help for generating points
    var genPoints = function (b, yTop, yBottom, yMiddle) {
      var x1 = obj.scale(b.start),
          x2 = obj.scale(b.stop);
      // draw a block if it's large enough
      if (x2 - x1 > obj.PTR_LEN) {
        var p = [  // x, y coordinates of block
          x1, yTop,
          x2, yTop,
          x2, yBottom,
          x1, yBottom
        ];
        // add the orientation pointer
        if (b.orientation == '+') {
          p[2] -= obj.PTR_LEN;
          p[4] -= obj.PTR_LEN;
          p.splice(4, 0, x2, yMiddle);
        } else if (b.orientation == '-') {
          p[0] += obj.PTR_LEN;
          p[6] += obj.PTR_LEN;
          p.push(x1, yMiddle);
        }
        return p;
      }
      // draw just a pointer
      var ptr = (b.orientation == '-') ? -obj.PTR_LEN : obj.PTR_LEN;
      return [  // x, y coordinates of block
        x1, yTop,
        x1 + ptr, yMiddle,
        x1, yBottom
      ];
    }
    // draw the blocks
  	var polygons = blocks.append('polygon')
      .attr('class', 'block')
  	  .style('fill',  c)
      .attr('points', function (b) {
        var yTop = ((obj.BLOCK_HEIGHT + obj.PAD) * b.y) + obj.PAD,
            yBottom = yTop + obj.BLOCK_HEIGHT,
            yMiddle = yTop + (obj.BLOCK_HEIGHT / 2),
            block = d3.select(this);
        d3.select(this)  // evil nested assignments!
          .attr('data-y-top', yTop)
          .attr('data-y-bottom', yBottom)
          .attr('data-y-middle', yMiddle);
        return genPoints(b, yTop, yBottom, yMiddle);
      });
    // draw the background highlight
    if (i % 2) {
      var box = track.node().getBBox();
      track.highlight = track.append('rect')
        .attr('y', obj.PAD)
        .attr('height', box.height)
        .attr('fill', '#e7e7e7')
        .moveToBack();
    }
    // draw the tooltips
    var tips = blocks.append('text')
      .attr('class', 'synteny-tip')
  	  .attr('text-anchor', 'end')
  	  .text(function (b) { return b.start + ' - ' + b.stop; })
      .attr('data-x', function (b) {
        var x1 = b.start,
            x2 = b.stop;
        return x1 + ((x2 - x1) / 2);
      })
      .attr('data-y', function (b) {
        return (obj.BLOCK_HEIGHT + obj.PAD) * (b.y + 1);
      })
      .attr('transform', function (b) {
        var tip = d3.select(this),
            x = obj.scale(tip.attr('data-x')),
            y = tip.attr('data-y');
        return 'translate(' + x + ', ' + y + ')';
      });
    // how the blocks are resized
    track.resize = function (polygons, tips) {
      var obj = this;
  	  polygons.attr('points', function (b) {
        var block = d3.select(this),
            yTop = block.attr('data-y-top'),
            yBottom = block.attr('data-y-bottom'),
            yMiddle = block.attr('data-y-middle');
        return genPoints(b, yTop, yBottom, yMiddle);
      });
      tips.attr('transform', function (b) {
        var tip = d3.select(this),
            o = parseInt(tip.attr('data-offset')),
            x = obj.scale(tip.attr('data-x')) + o,
            y = parseInt(tip.attr('data-y')) - o;
        //return 'translate(' + x +', ' + y + ') ' + tip.attr('data-rotate');
        return 'translate(' + x +', ' + y + ') rotate(-45)';
      });
      if (track.highlight !== undefined) {
        track.highlight.attr('width', this.viewer.attr('width'));
      }
    }.bind(this, polygons, tips);
    // how tips are adjusted so they don't overflow the view
    track.adjustTips = function (tips, resize) {
      var vRect = obj.viewer.node().getBoundingClientRect();
      tips.classed('synteny-tip', false)
        .attr('data-offset', function (b) {
          var tRect = this.getBoundingClientRect(),
              d = Math.sqrt(Math.pow(tRect.width, 2) / 2);  // rotated height
          return (tRect.bottom + d > vRect.bottom) ? d : 0;
          //return 'rotate(' + r + ')';
        })
        .classed('synteny-tip', true);
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
    var axis = d3.svg.axis()
      .scale(d3.scale.linear().domain([t, b]).range([t, b]))
      .orient('left')
      .tickValues(ticks)
      .tickFormat((y, i) => {
        return this.data.tracks[i].chromosome;
      });
    // draw the axes of the graph
    var yAxis = this.viewer.append('g')
      .attr('class', 'axis')
      .call(axis);
    yAxis.selectAll('text')
      .attr('class', (y, i) => {
        var cls = 'macro-' + i.toString();
        if (this.options.highlight.indexOf(this.data.tracks[i].chromosome) != -1)
          cls += ' bold';
        return cls;
      })
  	  .style('cursor', 'pointer')
      .on('mouseover', (y, i) => {
        var iStr = i.toString(),
            track = '.GCV [data-macro-track="' + iStr + '"]',
            name = this.data.tracks[i].chromosome,
            chromosome = '.GCV [data-chromosome="' + name + '"]';
        var selection = d3.selectAll(track + ', ' + chromosome)
          .filter(function () {
            var t = this.getAttribute('data-macro-track');
            return t === null || t == iStr;
          });
        this.beginHover(selection);
      })
      .on('mouseout', (y, i) => {
        var iStr = i.toString(),
            track = '.GCV [data-macro-track="' + iStr + '"]',
            name = this.data.tracks[i].chromosome,
            chromosome = '.GCV [data-chromosome="' + name + '"]';
        var selection = d3.selectAll(track + ', ' + chromosome)
          .filter(function () {
            var t = this.getAttribute('data-macro-track');
            return t === null || t == iStr;
          });
        this.endHover(selection);
      })
      .on('click', () => { this.options.nameClick(); });
    return yAxis;
  }

  /**
    * Gets the element under the element currently under mouse pointer.
    * @input {MouseEvent} e - The mouse event used to find the elements.
    * @output {HTMLElement} - The elements under the element current under the
    * mouse pointer.
    */
  private secondElementUnderPointer(e) {
    var x = e.clientX,
        y = e.clientY,
        stack = [];
    // find the elements
    var first = document.elementFromPoint(x, y);
    first.classList.add('pointer-events-none');
    var second = document.elementFromPoint(x, y);
    // reset pointer-events
    first.classList.remove('pointer-events-none');
    return second;
  }

  /**
    * Fires the given event on the given element.
    * @input {HTMLElement} el - The element to fire the event on.
    * @input {string} e - The event to be fired on the element.
    */
  private fireEvent(el, e) {
    if (el.fireEvent) {
      el.fireEvent('on' + e);
    } else {
      var eObj = document.createEvent('Events');
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
      this.fireEvent(this.block, 'mouseout');
    }
    if (el.classList.contains('block') && el !== this.block) {
      this.fireEvent(el, 'mouseover');
    }
  }

  /**
    * Creates the viewport over the specified genomic interval.
    * @return {object} - D3 selection of the viewport.
    */
  private drawViewport() {
    var h = parseInt(this.viewer.attr('height')) - this.PAD;
    var viewport = this.viewer.append('rect')
      .attr('class', 'viewport')
      .attr('y', this.PAD)
      .attr('height', h)
      .attr('cursor', (d) => {
        if (this.options.viewportDrag) return 'move';
        return 'auto';
      })
      // translate viewport mouse events to block mouse events
      .on('mouseover', () => {
        var el = this.secondElementUnderPointer(d3.event);
        this.artificialHover(el);
      })
  	  .on('mouseout', () => {
        var e = d3.event,
            el = document.elementFromPoint(e.clientX, e.clientY);
        this.artificialHover(el);
      })
      .on('mousemove', () => {
        var el = this.secondElementUnderPointer(d3.event);
        this.artificialHover(el);
      })
      .on('click', () => {
        var el = this.secondElementUnderPointer(d3.event);
        if (el.classList.contains('block'))
          this.fireEvent(el, 'click');
      });
    if (this.options.viewportDrag) {
      viewport.call(d3.behavior.drag()
        .on('drag', () => {
          var r = this.scale.range(),
              w = parseFloat(viewport.attr('width')),
              x = parseFloat(viewport.attr('x')),
              newX = Math.max(x + d3.event.dx, r[0]);
          if (newX + w > r[1]) newX = r[1] - w;
          viewport.attr('x', newX);
        })
        .on('dragend', () => {
          var x1 = parseFloat(viewport.attr('x')),
              x2 = x1 + parseFloat(viewport.attr('width')),
              d1 = this.scale.invert(x1),
              d2 = this.scale.invert(x2);
          this.options.viewportDrag(d1, d2);
        }));
    }
    // how the viewport is resized
    viewport.resize = function () {
      var x1 = this.scale(this.options.viewport.start),
          x2 = this.scale(this.options.viewport.stop);
      viewport.attr('x', x1).attr('width', x2 - x1);
    }.bind(this);
    // resize once to position everything
    viewport.resize();
    return viewport;
  }

  /** Draws the viewer. */
  protected draw() {
    // draw the x-axis
    var xAxis = this.drawXAxis();
    this.positionElement(xAxis);
    // decorate the resize function with that of the x-axis
    this.decorateResize(xAxis.resize);
    // draw the tracks
    var ticks = [],
        tracks = [];
    var t = this.viewer.attr('height');
    for (var i = 0; i < this.data.tracks.length; i++) {
      // make the track
      var track = this.drawTrack(i);
      // put it in the correct location
      var m = this.positionElement(track);
      // save the track's label location
      ticks.push(m);
      // save the track for the resize call
      tracks.push(track);
    }
    var b = this.viewer.attr('height');
    // decorate the resize function with that of the track
    var resizeTracks = function () {
      tracks.forEach(function (t, i) {
        t.resize();
      });
    }
    this.decorateResize(resizeTracks);
    // rotate the tips now that all the tracks have been drawn
    tracks.forEach(function (t, i) {
      t.adjustTips();
    });
    // move all tips to front
    this.viewer.selectAll('.synteny-tip').moveToFront();
    // draw the y-axis
    var yAxis = this.drawYAxis(ticks, t, b);
    this.left = Math.max(xAxis.labelWidth, yAxis.node().getBBox().width)
              + this.PAD;
    yAxis.attr('transform', 'translate(' + this.left + ', 0)');
    this.left += this.PAD;
    this.resize();
    // draw the viewport
    if (this.options.viewport) {
      var viewport = this.drawViewport();
      this.decorateResize(viewport.resize);
    }
    // create an auto resize iframe, if necessary
    if (this.options.autoResize) {
      this.resizer = this.autoResize(this.container, (e) => {
        this.resize();
      });
    }
    // add bottom padding
    var h = parseInt(this.viewer.attr('height')) + this.PAD;
    this.viewer.attr('height', h);
  }
  
  // Public

  /**
    * The constructor.
    * @param {HTMLElement|string} el - ID of or the element itself where the
    * viewer will be drawn in.
    * @param {object} data - The data the viewer will visualize.
    * @param {object} options - Optional parameters.
    */
  constructor(el, data, options) {
    super(el, data,
      (options && options.colors) || function (s) { return '#000000' }, options);
  }
}
