'use strict'

/** The Genomic Context Viewer namespace. */
//var GCV = {};

class Synteny {

  // Private

  // Constants
  _BLOCK_HEIGHT = 11;
  _PAD          = 2;
  _PTR_LEN      = 5;
  _FADE         = 0.15;
  _COLORS       = [  // 100 maximally distinct colors
    '#7A2719', '#5CE33C', '#E146E9', '#64C6DE', '#E8B031', '#322755', '#436521',
    '#DE8EBA', '#5C77E3', '#CEE197', '#E32C76', '#E54229', '#2F2418', '#E1A782',
    '#788483', '#68E8B2', '#9E2B85', '#E4E42A', '#D5D9D5', '#76404F', '#589BDB',
    '#E276DE', '#92C535', '#DE6459', '#E07529', '#A060E4', '#895997', '#7ED177',
    '#916D46', '#5BB0A4', '#365167', '#A4AE89', '#ACA630', '#38568F', '#D2B8E2',
    '#AF7B23', '#81A158', '#9E2F55', '#57E7E1', '#D8BD70', '#316F4B', '#5989A8',
    '#D17686', '#213F2C', '#A6808E', '#358937', '#504CA1', '#AA7CDD', '#393E0D',
    '#B02828', '#5EB381', '#47B033', '#DF3EAA', '#4E191E', '#9445AC', '#7A691F',
    '#382135', '#709628', '#EF6FB0', '#603719', '#6B5A57', '#A44A1C', '#ABC6E2',
    '#9883B0', '#A6E1D3', '#357975', '#DC3A56', '#561238', '#E1C5AB', '#8B8ED9',
    '#D897DF', '#61E575', '#E19B55', '#1F303A', '#A09258', '#B94781', '#A4E937',
    '#EAABBB', '#6E617D', '#B1A9AF', '#B16844', '#61307A', '#ED8B80', '#BB60A6',
    '#E15A7F', '#615C37', '#7C2363', '#D240C2', '#9A5854', '#643F64', '#8C2A36',
    '#698463', '#BAE367', '#E0DE51', '#BF8C7E', '#C8E6B6', '#A6577B', '#484A3A',
    '#D4DE7C', '#CD3488'
  ];

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
    iframe.contentWindow.onresize = f;
    return iframe;
  }

  /**
    * Fades everything in the view besides the given selection.
    * @param {object} selection - What's omitted from the fade.
    */
  _beginHover(selection) {
    d3.selectAll('.GCV').classed('hovering', true);
    selection.classed('active', true);
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

  /**
    * Computes the length of the longest string in the given array.
    * @param {array} text - The strings to be measured.
    * @return {number} The length of the longest string.
    */
  _longestString(text) {
    var dummy = this.viewer.append('g'),
        max = 0;
		dummy.selectAll('.dummyText')
		  .data(text)
		  .enter()
		  .append('text')
		  .text(function (s) { return s; })
		  .each(function (s, i) {
		    var l = this.getComputedTextLength();
        if (l > max) max = l;
		    this.remove();
		  });
		dummy.remove();
    return max;
  }

  /** Resizes the viewer and scale. Will be decorated by other components. */
  _resize() {
    var w = this.container.clientWidth,
        r1 = this.left + (2 * this._PAD),
        r2 = w - (this.right + this._PAD);
    this.viewer.attr('width', w);
    this.scale.range([r1, r2]);
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
    * @param {string} id - ID of element viewer will be drawn in.
    * @param {object} data - The data the viewer will visualize.
    * @param {object} options - Optional parameters.
    */
  _init(id, data, options) {
    // parse positional parameters
    this.container = document.getElementById(id);
    if (this.container === null) {
      throw new Error('"' + id + '" is not a valid element ID');
    }
    this.data = data;
    if (this.data === undefined) {
      throw new Error("'data' is undefined");
    }
    // create the viewer
    this.viewer = d3.select('#' + id)
      .append('svg')
      .attr('class', 'GCV')
      .attr('height', this._PAD);
    // compute the space required for chromosome names
		var chromosomes = [data.chromosome].concat(data.tracks.map(function (t) {
          return t.chromosome;
        }));
    this.left = this._longestString(chromosomes);
    this.right = this._longestString([data.length]) / 2;
    // create the scale used to map block coordinates to pixels
    this.scale = d3.scale.linear()
      .domain([0, data.length]);
    // make sure resize always has the right context
    this._resize = this._resize.bind(this);
    // initialize the viewer width and scale range
    this._resize();
    // parse optional parameters
    this.options = options || {};
    this.options.nameClick = options.nameClick || function (y, i) { };
    this.options.blockClick = options.blockClick || function (b) { };
    this.options.viewportDrag = options.viewportDrag;
    this.options.viewport = options.viewport || false;
    this.options.autoResize = options.autoResize || false;
  }

  /**
    * Positions the given element, resizes the viewer, and returns the vertical
    * center of the positioned element.
    * @param {object} e - The element to be positioned.
    * @return {number} - The vertical middle of the element after positioning.
    */
  _positionElement(e) {
    var h = e.node().getBBox().height,
        y = parseInt(this.viewer.attr('height'));
    e.attr('transform', 'translate(0, ' + (e.offset + y) + ')');
    this.viewer.attr('height', y + h + this._PAD);
    return y + (h / 2);
  }

  /**
    * Creates the x-axis.
    * @return {object} - D3 selection of the x-axis.
    */
  _drawXAxis() {
    // draw the axis
    var xAxis = this.viewer.append('g').attr('class', 'axis');
    // how the axis is resized
    xAxis.resize = function () {
      var axis = d3.svg.axis()
        .scale(this.scale)
        .orient('top')
        .tickValues(this.scale.domain())
        .tickFormat((x, i) => { return x; });
      xAxis.call(axis);
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
  _blocksToRows(data) {
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
  _drawTrack(i) {
    var obj = this,
        c = this._COLORS[i % this._COLORS.length],
        t = this.data.tracks[i];
    // create the track's rows of blocks
    this._blocksToRows(t.blocks);
  	// create the track
    var selector = 'track-' + i.toString(),
  	    track = this.viewer.append('g').attr('class', selector);
    track.offset = 0;
    // create the track's blocks
    var blocks = track.selectAll('block')
  	  .data(t.blocks)
  	  .enter()
      .append('g')
  	  .style('cursor', 'pointer')
      .on('mouseover', function (b) { obj._beginHover(d3.select(this)); })
  	  .on('mouseout', function (b) { obj._endHover(d3.select(this)); })
  	  .on('click', this.options.blockClick);
    // draw the blocks
  	var polygons = blocks.append('polygon')
      .attr('class', 'block')
  	  .style('fill', c);
    // draw the tooltips
    var tips = blocks.append('text')
      .attr('class', 'synteny-tip')
  	  .attr('text-anchor', 'right')
  	  .text(function (b) { return b.start + ' - ' + b.stop; });
    // how the blocks are resized
    track.resize = function (polygons, tips) {
      var obj = this;
  	  polygons.attr('points', function (b) {
        var x1 = obj.scale(b.start),
            y1 = ((obj._BLOCK_HEIGHT + obj._PAD) * b.y) + obj._PAD,
            x2 = obj.scale(b.stop),
            y2 = y1 + obj._BLOCK_HEIGHT,
            middle = y1 + (obj._BLOCK_HEIGHT / 2);
        // draw a block if it's large enough
        if (x2 - x1 > obj._PTR_LEN) {
          var p = [  // x, y coordinates of block
            x1, y1,
            x2, y1,
            x2, y2,
            x1, y2
          ];
          // add the orientation pointer
          if (b.orientation == '+') {
            p[2] -= obj._PTR_LEN;
            p[4] -= obj._PTR_LEN;
            p.splice(4, 0, x2, middle);
          } else if (b.orientation == '-') {
            p[0] += obj._PTR_LEN;
            p[6] += obj._PTR_LEN;
            p.push(x1, middle);
          }
          return p;
        }
        // draw just a pointer
        var ptr = (b.orientation == '-') ? -obj._PTR_LEN : obj._PTR_LEN;
        return [  // x, y coordinates of block
          x1, y1,
          x1 + ptr, middle,
          x1, y2
        ];
      });
      tips.classed('synteny-tip', false);
      tips.attr('transform', function (b) {
        // text lies on the hypotenuse of an Isosceles right triangle
        var l = this.getComputedTextLength(),  // length of hypotenuse
            o = Math.sqrt(Math.pow(l, 2) / 2),  // edge length of triangle
            x1 = obj.scale(b.start),
            x2 = obj.scale(b.stop),
            x = x1 + ((x2 - x1) / 2) - o,  // offset so text ends at block
            y = ((obj._BLOCK_HEIGHT + obj._PAD) * (b.y + 1)) + o;
        return 'translate(' + x + ', ' + y + ') rotate(-45)';
      });
      tips.classed('synteny-tip', true);
    }.bind(this, polygons, tips);
    // resize once to position everything
    track.resize();
    return track;
  }


  /**
    * Creates the y-axis, placing labels at their respective locations.
    * @param {array} ticks - The locations of the track labels.
    * @return {object} - D3 selection of the y-axis.
    */
  _drawYAxis(ticks) {
    // construct the y-axes
    var axis = d3.svg.axis()
      .orient('left')
      .tickValues(ticks)
      .tickFormat((y, i) => {
        if (i == 0) return this.data.chromosome;
        return this.data.tracks[i - 1].chromosome;
      });
    // draw the axes of the graph
    var yAxis = this.viewer.append('g')
      .attr('class', 'axis')
      .call(axis)
      .selectAll('text')
      .attr('class', function (y, i) {
        if (i == 0) return 'query';
        return 'track-' + (i - 1).toString();
      })
  	  .style('cursor', 'pointer')
      .on('mouseover', (y, i) => {
        if (i > 0) {
          var selection = d3.selectAll('.GCV .track-' + (i - 1).toString());
          this._beginHover(selection);
        }
      })
      .on('mouseout', (y, i) => {
        if (i > 0) {
          var selection = d3.selectAll('.GCV .track-' + (i - 1).toString());
          this._endHover(selection);
        }
      })
      .on('click', this.options.nameClick);
    return yAxis;
  }

  /**
    * Creates the viewport over the specified genomic interval.
    * @return {object} - D3 selection of the viewport.
    */
  _drawViewport() {
    var h = parseInt(this.viewer.attr('height')) - this._PAD;
    var viewport = this.viewer.append('rect')
      .attr('class', 'viewport')
      .attr('y', this._PAD)
      .attr('height', h)
      .attr('cursor', (d) => {
        if (this.options.viewportDrag) return 'move';
        return 'auto';
      });
    if (this.options.viewportDrag) {
      viewport.call(drag);
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
  _draw() {
    // draw the x-axis
    var xAxis = this._drawXAxis(),
        m = this._positionElement(xAxis);
    // decorate the resize function with that of the x-axis
    this._decorateResize(xAxis.resize);
    // draw the tracks
    var ticks = [m],
        tracks = [];
    for (var i = 0; i < this.data.tracks.length; i++) {
      // make the track
      var track = this._drawTrack(i);
      // put it in the correct location
      m = this._positionElement(track);
      // save the track's label location
      ticks.push(m);
      // save the track for the resize call
      tracks.push(track);
    }
    // decorate the resize function with that of the track
    var resizeTracks = function () {
      tracks.forEach(function (t, i) {
        t.resize();
      });
    }
    this._decorateResize(resizeTracks);
    // move all tips to front
    this.viewer.selectAll('.synteny-tip').moveToFront();
    // draw the y-axis
    var yAxis = this._drawYAxis(ticks);
    yAxis.attr('transform', 'translate(' + this.left + ', 0)');
    // draw the viewport
    if (this.options.viewport) {
      var viewport = this._drawViewport();
      this._decorateResize(viewport.resize);
    }
    // create an auto resize iframe if necessary
    if (this.options.autoResize) {
      this.resizer = this._autoResize(this.container, (e) => {
        this._resize();
      });
    }
  }
  
  // Public

  /**
    * The constructor.
    * @param {string} id - ID of element viewer will be drawn in.
    * @param {object} data - The data the viewer will visualize.
    * @param {object} options - Optional parameters.
    */
  constructor(id, data, options) {
    this._init(id, data, options);
    this._draw();
  }
}
