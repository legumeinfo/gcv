'use strict'

/** The Genomic Context Viewer namespace. */
//var GCV = {};

class Synteny {

  // Private

  // Constants
  _BLOCK_HEIGHT = 11;
  _PAD         = 2;
  _RIGHT       = 10;
  _NAME_SPACE  = 100;
  _PTR_LEN = 5;
  _FADE        = 0.15;
  _COLORS      = [  // 100 maximally distinct colors
    "#7A2719", "#5CE33C", "#E146E9", "#64C6DE", "#E8B031", "#322755", "#436521",
    "#DE8EBA", "#5C77E3", "#CEE197", "#E32C76", "#E54229", "#2F2418", "#E1A782",
    "#788483", "#68E8B2", "#9E2B85", "#E4E42A", "#D5D9D5", "#76404F", "#589BDB",
    "#E276DE", "#92C535", "#DE6459", "#E07529", "#A060E4", "#895997", "#7ED177",
    "#916D46", "#5BB0A4", "#365167", "#A4AE89", "#ACA630", "#38568F", "#D2B8E2",
    "#AF7B23", "#81A158", "#9E2F55", "#57E7E1", "#D8BD70", "#316F4B", "#5989A8",
    "#D17686", "#213F2C", "#A6808E", "#358937", "#504CA1", "#AA7CDD", "#393E0D",
    "#B02828", "#5EB381", "#47B033", "#DF3EAA", "#4E191E", "#9445AC", "#7A691F",
    "#382135", "#709628", "#EF6FB0", "#603719", "#6B5A57", "#A44A1C", "#ABC6E2",
    "#9883B0", "#A6E1D3", "#357975", "#DC3A56", "#561238", "#E1C5AB", "#8B8ED9",
    "#D897DF", "#61E575", "#E19B55", "#1F303A", "#A09258", "#B94781", "#A4E937",
    "#EAABBB", "#6E617D", "#B1A9AF", "#B16844", "#61307A", "#ED8B80", "#BB60A6",
    "#E15A7F", "#615C37", "#7C2363", "#D240C2", "#9A5854", "#643F64", "#8C2A36",
    "#698463", "#BAE367", "#E0DE51", "#BF8C7E", "#C8E6B6", "#A6577B", "#484A3A",
    "#D4DE7C", "#CD3488"
  ];

  /*
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
    this.w = this.container.clientWidth;
    this.data = data;
    if (this.data === undefined) {
      throw new Error("'data' is undefined");
    }
    this.scale = d3.scale.linear()
      .domain([0, data.length])
      .range([this._NAME_SPACE, this.w - this._RIGHT]);
    // parse optional parameters
    this.options = options || {};
    this.options.nameClick = options.nameClick || function (n) { };
    this.options.blockClick = options.blockClick || function (b) { };
    this.options.viewport = options.viewport || undefined;
    this.options.autoResize = options.autoResize || false;
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
    * @return {object} D3 selection of the new track.
    */
  _drawTrack(i) {
    var c = this._COLORS[i % this._COLORS.length],
        t = this.data.tracks[i];
    // create the track's rows of blocks
    this._blocksToRows(t.blocks);
  	// draw the track
    var selector = ".track-" + i.toString(),
  	    track = this.viewer.append('g').attr('class', selector);
    // draw the track's blocks
    track.selectAll('.block')
  	  .data(t.blocks)
  	  .enter()
  	  .append("polygon")
  	  .attr("points", (b) => {
        var x1 = this.scale(b.start),
            y1 = ((this._BLOCK_HEIGHT + this._PAD) * b.y) + this._PAD,
            x2 = this.scale(b.stop),
            y2 = y1 + this._BLOCK_HEIGHT,
            middle = y1 + (this._BLOCK_HEIGHT / 2);
        // draw a block if it's large enough
        if (x2 - x1 > this._PTR_LEN) {
          var p = [  // x, y coordinates of block
            x1, y1,
            x2, y1,
            x2, y2,
            x1, y2
          ];
          // add the orientation pointer
          if (b.orientation == '+') {
            p[2] -= this._PTR_LEN;
            p[4] -= this._PTR_LEN;
            p.splice(4, 0, x2, middle);
          } else if (b.orientation == '-') {
            p[0] += this._PTR_LEN;
            p[6] += this._PTR_LEN;
            p.push(x1, middle);
          }
          return p;
        }
        // draw just a pointer
        var ptr = (b.orientation == '-') ? -this._PTR_LEN : this._PTR_LEN;
        return [  // x, y coordinates of block
          x1, y1,
          x1 + ptr, middle,
          x1, y2
        ];
      })
  	  .style("fill", c)
  	  .style("cursor", "pointer")
      .on("mouseover", (b) => {
        console.log("over");
  	  })
  	  .on("mouseout", (b) => {
        console.log("out");
  	  })
  	  .on('click', (b) => {
        this.options.blockClick(b);
  	  });
    return track;
  }

  /** Draws the viewer. */
  _draw() {
    this.viewer = d3.select('#' + this.container.id)
      .append("svg")
      .attr("width", this.w)
      .attr("height", this._PAD);
    var ticks = [];
    // draw the tracks
    var tallestTip = 0;
    for (var i = 0; i < this.data.tracks.length; i++) {
      // make the track
      var track = this._drawTrack(i),
          y = parseInt(this.viewer.attr("height"));
      // put it in the correct location
      track.attr("transform", "translate(0," + y + ")")
      // adjust the height of the viewer
      var h = track.node().getBBox().height;
      this.viewer.attr("height", y + h + this._PAD);
      // save the track's label location
      ticks.push(y + (h / 2));
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
