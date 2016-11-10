'use strict'


/** The Genomic Context Viewer namespace. */
var GCV = GCV || {};

// merge partitions from same chromosome with the interval scheduling
// greedy algorithm
// TODO: should be same group only
//var partition_groups = [];
//// sort the partition groups by "finish time"
//partitions[id].sort(function (a, b) {
//  return a[a.length-1].x-b[b.length-1].x;
//});
//// generate the merged tracks
//while (partitions[id].length > 0) {
//  var track_genes = [];
//  var remove = [];
//  for (var i = 0; i < partitions[id].length; i++) {
//    // make sure the genes are ordered by x coordinate
//    partitions[id].sort(function (a, b) {
//      return a.x-b.x;
//    });
//    // greedy ordering
//    var partition = partitions[id][i];
//    if (track_genes.length == 0 ||
//        partition[0].x > track_genes[track_genes.length-1].x) {
//      track_genes = track_genes.concat(partition);
//      remove.push(i);
//    }
//  }
//  // remove the tracks that were merged
//  for (var i = remove.length-1; i >= 0; i--) {
//    partitions[id].splice(remove[i], 1);
//  }
//  // save the new group
//  var group = clone(groups[id]);
//  group.genes = track_genes.slice(0);
//  partition_groups.push(group);
//}
//// order the new groups largest to smallest
//partition_groups.sort(function (a, b) {
//  return b.genes.length-a.genes.length;
//});
//// add the new groups to the data
//for (var i = 0; i < partition_groups.length; i++) {
//  partition_groups[i].genes = partition_groups[i].genes.map(
//                              function(gene) {
//                                gene.y = group_y;
//                                return gene;
//                              });
//  group_y++;
//  tracks.groups.push(partition_groups[i]);
//}


/**
  * Merges overlapping tracks from the same group to maximize alignment score.
  * @param {object} data - The micro-synteny viewer data to be merged.
  */
GCV.merge = function (data) {
  // make a copy of the data (tracks)
  var tracks = $.extend(true, {}, data);
  // groups tracks by group id
  var groups = {};
  for (var i = 1; i < tracks.groups.length; i++) {  // skip first (query) track
    var track = tracks.groups[i];
    groups[track.id] = groups[track.id] || [];
    groups[track.id].push(track);
  }
  tracks.groups = [tracks.groups[0]];
  // try to merge each partition
  for (var i in groups) {
    if (!groups.hasOwnProperty(i)) {
      continue;
    }
    var groupTracks = groups[i],
        merged = [];  // which tracks have been merged into another
    // iterate pairs of tracks to see if one is a sub-inversion of the other
    for (var j = 0; j < groupTracks.length; j++) {
      // only consider non-merged tracks
      if (merged.indexOf(j) != -1) {
        continue;
      }
      var jTrack = groupTracks[j],
          jIds = jTrack.genes.map(function (g) { return g.id; });
      for (var k = j + 1; k < groupTracks.length; k++) {
        // only consider non-merged tracks
        if (merged.indexOf(k) != -1) {
          continue;
        }
        var kTrack = groupTracks[k],
            kIds = kTrack.genes.map(function (g) { return g.id; });
        // compute the intersection
        var overlap = jIds.filter(function (id) {
          return kIds.indexOf(id) != -1;
        });
        if (overlap.length > 0) {
          // j is the inversion
          if (kIds.length > jIds.length) {
            // get index list
            var indices = overlap.map(function (id) {
              return kIds.indexOf(id);
            });
            // compute the score of the inverted sequence before inverting
            var min = Math.min.apply(null, indices),
                max = Math.max.apply(null, indices);
            var startGene = kTrack.genes[min],
                endGene = kTrack.genes[max];
            var score = endGene.suffixScore - startGene.suffixScore;
            // perform the inversion if it will improve the super-track's score
            if (jTrack.score > score) {
              merged.push(j);
              // perform the inversion
              var args = [min, max - min + 1],
                  geneArgs = args.concat(jTrack.genes);
              Array.prototype.splice.apply(kTrack.genes, geneArgs);
              // adjust inversion scores and y coordinates
              var pred = (min > 0) ? kTrack.genes[min - 1].suffixScore : 0;
              for (var l = min; l <= max; l++) {
                kTrack.genes[l].suffixScore += pred;
                kTrack.genes[l].y = kTrack.levels;
              }
              // adjust post-inversion scores
              var adjustment = jTrack.score - score;
              for (var l = max + 1; l < kTrack.genes.length; l++) {
                kTrack.genes[l].suffixScore += adjustment;
              }
              kTrack.score += adjustment;
              // increment the level counter
              kTrack.levels++;
              // a track can only be merged once
              break;
            }
          // k is the inversion
          } else if (jIds.length == kIds.length) {
            // get index list
            var indices = overlap.map(function (id) {
              return jIds.indexOf(id);
            });
            // compute the score of the inverted sequence before inverting
            var min = Math.min.apply(null, indices),
                max = Math.max.apply(null, indices);
            var startGene = jTrack.genes[min],
                endGene = jTrack.genes[max];
            var score = endGene.suffixScore - startGene.suffixScore;
            // perform the inversion if it will improve the super-track's score
            if (kTrack.score > score) {
              merged.push(k);
              // perform the inversion
              var args = [min, max - min + 1],
                  geneArgs = args.concat(kTrack.genes),
                  idArgs = args.concat(kIds);
              Array.prototype.splice.apply(jTrack.genes, geneArgs);
              Array.prototype.splice.apply(jIds, idArgs);
              // adjust inversion scores and y coordinates
              var pred = (min > 0) ? jTrack.genes[min - 1].suffixScore : 0;
              for (var l = min; l <= max; l++) {
                jTrack.genes[l].suffixScore += pred;
                jTrack.genes[l].y = jTrack.levels;
              }
              // adjust post-inversion scores
              var adjustment = kTrack.score - score;
              for (var l = max + 1; l < jTrack.genes.length; l++) {
                jTrack.genes[l].suffixScore += adjustment;
              }
              jTrack.score += adjustment;
              // increment the level counter
              jTrack.levels++;
            }
          }
        }
      }
      // add the track if it wasn't merged during its iteration
      if (merged.indexOf(j) == -1) {
        tracks.groups.push(jTrack);
      }
    }
  }
  return tracks;
}


/** The micro-synteny viewer. */
GCV.Viewer = class {

//  // add the tracks (groups)
//  for (var i = 0; i < data.groups.length; i++) {
//  	// helper that draws lines between two given genes
//    function draw_line(a, b) {
//  	  var length = x(a.x)-x(b.x);
//  	  var rail_group = viewer.append("g")
//  	    .attr("class", "rail")
//  	    .attr("transform", function () {
//  	      return "translate("+x(b.x)+", "+y(b.y)+")";
//  	    })
//  	    .attr("y", b.y) // does nothing besides hold the datum
//  	    .data(function () {
//  	      if (a.fmin > b.fmax) {
//  	        return [a.fmin-b.fmax];
//  	      }
//  	      return [b.fmin-a.fmax];
//  	    });
//  	  rail_group.append("line")
//  	  	.attr("class", "line")
//  	  	.attr("x1", 0)
//  	  	.attr("x2", length)
//  	  	.attr("y1", 0)
//  	  	.attr("y2", y(a.y)-y(b.y));
//  	  rail_group.append("text")
//  	  	.attr("class", "tip")
//  	  	.attr("transform", "translate("+(length/2)+", -10) rotate(-45)")
//  	  	.attr("text-anchor", "left")
//  	  	.text(function (d) {
//  	      return rail_group.data();
//  	  	});
//  	  rail_group.moveToBack();
//    }
//  	// add rails to the tracks
//    var partition = false;
//  	gene_groups.each(function (d) {
//  	  var closest;
//  	  var neighbors = gene_groups.filter(function (n) {
//  	  	return n.y == d.y;
//  	  });
//  	  neighbors.each(function (n) {
//  	  	if (n.x < d.x && (closest === undefined || n.x > closest.x)) {
//  	  	  closest = n;
//  	  	}
//  	  });
//      if (opt.interTrack !== undefined && opt.interTrack == true) {
//        if (closest !== undefined &&
//            !(left_breaks[d.group_id].indexOf(d.uid) != -1 &&
//              right_breaks[closest.group_id].indexOf(closest.uid) != -1)) {
//          draw_line(d, closest);
//        }
//        var inter = interTracks[d.group_id][d.uid];
//        // some inter-track lines may have been noted before a participating
//        // gene was omitted
//        if (inter !== undefined &&
//            omit[inter.group_id].indexOf(inter.uid) == -1) {
//          draw_line(d, interTracks[d.group_id][d.uid]);
//        }
//      } else if (closest !== undefined) {
//        draw_line(d, closest);
//      }
//  	});
//  }
//  
//  // make thickness of lines a function of their "length"
//  var max_width = d3.max(rail_groups.data());
//  var min_width = d3.min(rail_groups.data());
//  var width = d3.scale.linear()
//    .domain([min_width, max_width])
//    .range([.1, 5]);
//  rail_groups.attr("stroke-width", function (d) { return width(d); });
//  

  // Private

  // Constants
  _PAD = 5;
  _GLYPH_SIZE = 30;

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

  /** Resizes the viewer and x scale. Will be decorated by other components. */
  _resize() {
    var w = this.container.clientWidth,
        doublePad = 2 * this._PAD,
        halfGlyph = this._GLYPH_SIZE / 2,
        r1 = this.left + halfGlyph,
        r2 = w - (this.right + halfGlyph);
    this.viewer.attr('width', w);
    this.x.range([r1, r2]);
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
    * @param {object} colors - D3 family-to-color map.
    * @param {object} data - The data the viewer will visualize.
    * @param {object} options - Optional parameters.
    */
  _init(id, colors, data, options) {
    // parse positional parameters
    this.container = document.getElementById(id);
    if (this.container === null) {
      throw new Error('"' + id + '" is not a valid element ID');
    }
    this.colors = colors;
    if (this.colors === undefined) {
      throw new Error('"color" is undefined');
    }
    this.data = data;
    if (this.data === undefined) {
      throw new Error('"data" is undefined');
    }
    // create the viewer
    var numLevels = this.data.groups.reduce(function (sum, g) {
          return sum + g.levels;
        }, 0),
        halfTrack = this._GLYPH_SIZE / 2,
        top = this._PAD + halfTrack,
        bottom = top + (this._GLYPH_SIZE * numLevels);
    this.viewer = d3.select('#' + id)
      .append('svg')
      .attr('class', 'GCV')
      .attr('height', bottom + halfTrack);
    // compute the x scale and the space required for track names
    var minX = Infinity,
        maxX = -Infinity;
    this.ticks = [];
		this.names = []
    var tick = 0;
    for (var i = 0; i < data.groups.length; i++) {
      var group = data.groups[i],
          min = Infinity,
          max = -Infinity;
      this.ticks.push(tick);
      tick += group.levels;
      for (var j = 0; j < group.genes.length; j++) {
        var gene = group.genes[j],
            fmax = gene.fmax,
            fmin = gene.fmin,
            x = gene.x;
        min = Math.min.apply(null, [min, fmax, fmin]);
        max = Math.max.apply(null, [max, fmax, fmin]);
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      }
      this.names.push(group.chromosome_name + ':' + min + '-' + max);
    }
    // initialize the x and y scales
    this.x = d3.scale.linear().domain([minX, maxX]);
    this.y = d3.scale.linear().domain([0, numLevels - 1])
               .range([top, bottom]);
    // parse optional parameters
    this.options = options || {};
    this.options.focus = options.focus;
    this.options.selectiveColoring = options.selectiveColoring;
    this.options.nameClick = options.nameClick || function (y, i) { };
    this.options.geneClick = options.geneClick || function (b) { };
    this.options.plotClick = options.plotClick;
    this.options.autoResize = options.autoResize || false;
    // set the right padding
    this.right = this._PAD;
    // make sure resize always has the right context
    this._resize = this._resize.bind(this);
  }

  /**
    * Creates a graphic containing a track's genes.
    * @param {number} i - The index of the track in the input data to draw.
    * @return {object} - D3 selection of the new track.
    */
  _drawTrack(i) {
    var obj = this,
        t = this.data.groups[i],
        y = this.ticks[i];
  	// make svg groups for the genes
    var selector = 'micro-' + i.toString(),
  	    track = this.viewer.append('g').attr('class', selector),
  	    geneGroups = track.selectAll('gene')
      .data(t.genes)
  	  .enter()
  	  .append('g')
  	  .attr('class', 'gene')
  	  .attr('transform', function (g) {
  	    return 'translate(' + obj.x(g.x) + ', ' + obj.y(y + g.y) + ')';
  	  })
  	  .style('cursor', 'pointer')
      .on('mouseover', function (g) { obj._beginHover(d3.select(this)); })
  	  .on('mouseout', function (g) { obj._endHover(d3.select(this)); })
  	  .on('click', obj.options.geneClick);
  
  	// add genes to the svg groups
  	var genes = geneGroups.append('path')
  	  .attr('d', d3.svg.symbol().type('triangle-up').size(200))
  	  .attr('class', function (g) {
  	  	if (obj.options.focus !== undefined &&
        (obj.options.focus == g.family || obj.options.focus == g.name)) {
  	  	  return 'point focus';
  	  	} else if (g.family == '') {
  	  	  return 'point no_fam';
  	  	} else if (obj.options.selectiveColoring !== undefined &&
        obj.options.selectiveColoring[g.family] == 1) {
  	  	  return 'point single';
  	  	} return 'point';
      })
  	  .attr('transform', function (g) {
        var orientation = (g.strand == 1) ? '90' : '-90';
        return 'rotate(' + orientation + ')';
      })
  	  .style('fill', function (g) {
  	  	if (g.family == '' ||
        (obj.options.selectiveColoring !== undefined &&
        obj.options.selectiveColoring[g.family] == 1)) {
  	  	  return '#ffffff';
  	  	} return obj.colors(g.family);
  	  });
    // draw the tooltips
    var tips = geneGroups.append('text')
      .attr('class', 'synteny-tip')
  	  .attr('text-anchor', 'end')
  	  .text(function (g) { return g.name + ': ' + g.fmin + ' - ' + g.fmax; })
    // how the blocks are resized
    track.resize = function (genesGroups, tips) {
      var obj = this;
      geneGroups.attr('transform', function (g) {
        return 'translate(' + obj.x(g.x) + ', ' + obj.y(y + g.y) + ')';
  	  });
    }.bind(this, geneGroups, tips);
    // how tips are rotated so they don't overflow the view
    track.rotateTips = function (tips, resize) {
      var vRect = obj.viewer.node().getBoundingClientRect();
      tips.classed('synteny-tip', false)
        .attr('transform', function (t) {
          var tRect = this.getBoundingClientRect(),
              h = Math.sqrt(Math.pow(tRect.width, 2) / 2),  // rotated height
              r = (tRect.bottom + h > vRect.bottom) ? 45 : -45;
          return 'rotate(' + r + ')';
        })
        .classed('synteny-tip', true);
      resize();
    }.bind(this, tips, track.resize);
    return track;
  }


  /**
    * Creates the y-axis, placing labels at their respective locations.
    * @return {object} - D3 selection of the y-axis.
    */
  _drawYAxis() {
    // construct the y-axes
    var axis = d3.svg.axis().scale(this.y)
      .orient('left')
      .tickValues(this.ticks)
      .tickFormat((y, i) => { return this.names[i]; });
    // draw the axes of the graph
    var yAxis = this.viewer.append('g')
      .attr('class', 'axis')
      .call(axis);
    yAxis.selectAll('text')
      .attr('class', function (y, i) {
        var c = (i == 0) ? 'query ' : '';
        return c + 'micro-' + i.toString();
      })
  	  .style('cursor', 'pointer')
      .on('mouseover', (y, i) => {
        var selection = d3.selectAll('.GCV .micro-' + i.toString());
        this._beginHover(selection);
      })
      .on('mouseout', (y, i) => {
        var selection = d3.selectAll('.GCV .micro-' + i.toString());
        this._endHover(selection);
      })
      .on('click', this.options.nameClick);
    return yAxis;
  }


  /**
    * Creates the plot y-axis, placing labels at their respective locations.
    * @return {object} - D3 selection of the plot y-axis.
    */
  _drawPlotAxis() {
    // construct the plot y-axes
    var axis = d3.svg.axis().scale(this.y)
      .orient('right')
      .tickValues(this.ticks)
      .tickFormat('plot');
    // draw the axes of the graph
    var plotYAxis = this.viewer.append('g')
      .attr('class', 'axis')
      .call(axis);
    plotYAxis.selectAll('text')
  	  .style('cursor', 'pointer')
      .on('click', this.options.plotClick);
    return plotYAxis;
  }

  /** Draws the viewer. */
  _draw() {
    // draw the y-axes
    var yAxis = this._drawYAxis();
    this.left = yAxis.node().getBBox().width + this._PAD;
    yAxis.attr('transform', 'translate(' + this.left + ', 0)');
    this.left += this._PAD;
    if (this.options.plotClick) {
      var plotAxis = this._drawPlotAxis();
      this.right += plotAxis.node().getBBox().width + this._PAD;
      var obj = this;
      var resizePlotYAxis = function () {
        var x = obj.viewer.attr('width') - obj.right + obj._PAD;
        plotAxis.attr('transform', 'translate(' + x + ', 0)');
      }
      this._decorateResize(resizePlotYAxis);
    }
    this._resize();
    // draw the tracks
    var tracks = [];
    for (var i = 0; i < this.data.groups.length; i++) {
      // make the track and save it for the resize call
      tracks.push(this._drawTrack(i));
    }
    // decorate the resize function with that of the track
    var resizeTracks = function () {
      tracks.forEach(function (t, i) {
        t.resize();
      });
    }
    this._decorateResize(resizeTracks);
    // rotate the tips now that all the tracks have been drawn
    tracks.forEach(function (t, i) {
      t.rotateTips();
    });
    // move all tips to front
    this.viewer.selectAll('.synteny-tip').moveToFront();
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
    * @param {string} id - ID of element viewer will be drawn in.
    * @param {object} colors - D3 family-to-color map.
    * @param {object} data - The data the viewer will visualize.
    * @param {object} options - Optional parameters.
    */
  constructor(id, colors, data, options) {
    this._init(id, colors, data, options);
    this._draw();
  }

  /** Manually destroys the viewer. */
  destroy() {
    if (this.container) {
      this.container.removeChild(this.viewer.node());
      if (this.resizer) {
        this.container.removeChild(this.resizer);
      }
    }
    this.container = this.viewer = this.resizer = undefined;
  }
}
