var Synteny = (function (PIXI) {

  /* private */

  /* variables */

  var _FADE = 0.15;

  // 100 maximally distinct colors
  var _colors = [0x7A2719, 0x5CE33C, 0xE146E9, 0x64C6DE, 0xE8B031, 0x322755, 0x436521, 0xDE8EBA, 0x5C77E3, 0xCEE197, 0xE32C76, 0xE54229, 0x2F2418, 0xE1A782, 0x788483, 0x68E8B2, 0x9E2B85, 0xE4E42A, 0xD5D9D5, 0x76404F, 0x589BDB, 0xE276DE, 0x92C535, 0xDE6459, 0xE07529, 0xA060E4, 0x895997, 0x7ED177, 0x916D46, 0x5BB0A4, 0x365167, 0xA4AE89, 0xACA630, 0x38568F, 0xD2B8E2, 0xAF7B23, 0x81A158, 0x9E2F55, 0x57E7E1, 0xD8BD70, 0x316F4B, 0x5989A8, 0xD17686, 0x213F2C, 0xA6808E, 0x358937, 0x504CA1, 0xAA7CDD, 0x393E0D, 0xB02828, 0x5EB381, 0x47B033, 0xDF3EAA, 0x4E191E, 0x9445AC, 0x7A691F, 0x382135, 0x709628, 0xEF6FB0, 0x603719, 0x6B5A57, 0xA44A1C, 0xABC6E2, 0x9883B0, 0xA6E1D3, 0x357975, 0xDC3A56, 0x561238, 0xE1C5AB, 0x8B8ED9, 0xD897DF, 0x61E575, 0xE19B55, 0x1F303A, 0xA09258, 0xB94781, 0xA4E937, 0xEAABBB, 0x6E617D, 0xB1A9AF, 0xB16844, 0x61307A, 0xED8B80, 0xBB60A6, 0xE15A7F, 0x615C37, 0x7C2363, 0xD240C2, 0x9A5854, 0x643F64, 0x8C2A36, 0x698463, 0xBAE367, 0xE0DE51, 0xBF8C7E, 0xC8E6B6, 0xA6577B, 0x484A3A, 0xD4DE7C, 0xCD3488];

  /* PIXI drawing functions */
  
  // greedy interval scheduling algorithm for grouping track blocks
  var _rows = function (blocks) {
    // create a copy so there are no side effects
    var orderedBlocks = blocks.slice();
    // reverse sort by stop location so we can remove elements during iteration
    orderedBlocks.sort(function (a, b) {
      return b.stop - a.stop;
    });
    // create track rows
    var rows = [];
    while (orderedBlocks.length > 0) {
      // the first block to stop will start the row
      var row = orderedBlocks.splice(orderedBlocks.length - 1, 1);
      var k = 0;
      // iteratively add blocks whose starts don't overlap with the last stop
      for (var i = orderedBlocks.length - 1; i >= 0; i--) {
        if (orderedBlocks[i].start > row[k].stop) {
          row.push.apply(row, orderedBlocks.splice(i, 1));
          k++;
        }
      }
      rows.push(row);
    }
    return rows;
  }

  // create a graphic containing a track's blocks
  var _track = function (scale, NAME_OFFSET, HEIGHT, PADDING, COLOR, data,
  nameClick, blockClick) {
    // helper that draws blocks
    var POINTER_LENGTH = 5;
    var _trackBlock = function(b, y1, s) {
      // create a Graphics to draw the block in
      var block = new PIXI.Graphics();
      // set a fill and line style
      block.beginFill(COLOR);
      block.lineStyle(1, COLOR, 1);
      // create the polygon points of the block
      var y2 = y1 + HEIGHT;
      var x1 = s * b.start;
      var x2 = s * b.stop;
      var points = [  // x, y coordinates of block
        x1, y1,
        x2, y1,
        x2, y2,
        x1, y2
      ];
      var middle = y1 + (HEIGHT / 2);
      // add the orientation pointer
      if (b.orientation == '+') {
        points[2] -= POINTER_LENGTH;
        points[4] -= POINTER_LENGTH;
        points.splice(4, 0, (s * b.stop), middle);
      } else if (b.orientation == '-') {
        points[0] += POINTER_LENGTH;
        points[6] += POINTER_LENGTH;
        points.push((s * b.start), middle);
      }
      // draw the block
      block.drawPolygon(points);
      block.endFill();
      // make the block interactive
      block.interactive = true;
      // make the cursor a pointer when it rolls over the track
      block.buttonMode = true;
      // the events
      block.clickCallback = blockClick;
      block
        .on('mouseover', _mouseoverBlock)
        .on('mouseout', _mouseoutBlock)
        .on('click', _clickBlock);
      // give the block the data it was created with
      block.data = b;
      // tell the block how to associate a tooltip
      block.setTip = function (tip) {
        tip.position.x = NAME_OFFSET + x1 + ((x2 - x1) / 2);
        block.tip = tip;
      }
      return block;
    }
    // create the rows for the track
    var rows = _rows(data.blocks);
    // where the blocks will be drawn
    var blocks = new PIXI.Container();
    // draw each row in the track
    var tipArgs = {font : HEIGHT + 'px Arial', align : 'left'};
    var tallestTip = 0;
    for (var i = 0; i < rows.length; i++) {
      var iBlocks = rows[i];
      var y = (HEIGHT + PADDING) * i + PADDING;
      // draw each block in the row
      for (var k = 0; k < iBlocks.length; k++) {
        var b = iBlocks[k];
        // create the block
        var block = _trackBlock(b, y, scale);
        // create a tooltip for the block
        var tip = new PIXI.Text(b.start + ' - ' + b.stop, tipArgs);
        tip.position.y = y;
        tip.rotation = 45 * (Math.PI / 180);
        block.setTip(tip);
        // compute the tip's rotated height and see if it's the largest
        var height = Math.sqrt(Math.pow(tip.width, 2) / 2);
        tallestTip = Math.max(tallestTip, height);
        // add the block to the container
        blocks.addChild(block);
      }
    }
    blocks.position.x = NAME_OFFSET;
    // create the track name
    var nameArgs = {font : HEIGHT + 'px Arial', align : 'right'};
    var name = new PIXI.Text(data.chromosome, nameArgs);
    // position it next to the blocks
    name.position.x = NAME_OFFSET - (name.width + (2 * PADDING));
    name.position.y = (blocks.height - name.height) / 2;
    // make it interactive
    name.interactive = true;
    name.buttonMode = true;
    name.clickCallback = nameClick;
    name
      // when a click begins
      .on('mousedown', _mousedownName)
      .on('touchstart', _mousedownName)
      // when a click ends
      .on('mouseup', _mouseupName)
      .on('touchend', _mouseupName)
      .on('mouseupoutside', _mouseupName)
      .on('touchendoutside', _mouseupName)
      // when a mouse is moved in, out, and over the name
      .on('mouseover', _mouseoverName)
      .on('mousemove', _mousemoveName)
      .on('mouseout', _mouseoutName);
    // add the name and blocks to a track
    var track = new PIXI.Container();
    track.addChild(name);
    track.addChild(blocks);
    track.tallestTip = tallestTip;
    // let it know what name and blocks it has
    track.name = name;
    track.blocks = blocks.children;
    // how the track is resized
    track.resize = function(s) {
      // resize the blocks
      for (var i = 0; i < blocks.children.length; i++) {
        var block = blocks.children[i];
        // save the tip
        var tip = block.tip;
        // draw a new block
        blocks.removeChild(block);
        block = _trackBlock(block.data, tip.position.y, s);
        // give it the old tip
        block.setTip(tip);
        // add it to the track
        blocks.addChild(block);
      }
    }
    return track;
  }

  // creates the query ruler graphic
  var _ruler = function (chromosome, LENGTH, scale, NAME_OFFSET, HEIGHT,
  PADDING) {
    // helper for drawing the ruler line
    var width = LENGTH * scale;
    var _rulerLine = function () {
      // the line Graphics
      var line = new PIXI.Graphics();
      // where it's located
      line.position.x = NAME_OFFSET;
      // actually draw the line
      line.lineStyle(1, 0x000000, 1);
      line.moveTo(0, HEIGHT);
      line.lineTo(0, HEIGHT / 2);
      line.lineTo(width, HEIGHT / 2);
      line.lineTo(width, HEIGHT);
      line.endFill();
      return line;
    }
    // create the query name
    var args = {font : 'bold ' + HEIGHT + 'px Arial', align : 'right'};
    var name = new PIXI.Text(chromosome, args);
    name.position.x = NAME_OFFSET - (name.width + (2 * PADDING));
    name.position.y = HEIGHT / 2;
    // create the line
    var line = _rulerLine();
    // add the genome length labels
    var start = new PIXI.Text('0', args);
    start.position.x = NAME_OFFSET;
    start.position.y = HEIGHT;
    var stop = new PIXI.Text(LENGTH, args);
    stop.setX = function() {
      this.position.x = NAME_OFFSET + width - this.width;
    }
    stop.setX();
    stop.position.y = HEIGHT;
    // add the pieces to a ruler
    var ruler = new PIXI.Container();
    ruler.addChild(name);
    ruler.addChild(line);
    ruler.addChild(start);
    ruler.addChild(stop);
    // how the ruler is resized
    ruler.resize = function(scale) {
      // resize the line
      width = LENGTH * scale;
      this.removeChild(line);
      line = _rulerLine();
      this.addChild(line);
      // reposition the stop label
      stop.setX();
    }
    return ruler;
  }

  var _viewport = function (start, stop, NAME_OFFSET, scale, y, HEIGHT) {
    // helper that computes the x position and width of the viewport
    var _viewportBounds = function (scale) {
      var x = NAME_OFFSET + (scale * start);
      var width = (scale * (stop - start));
      return {x: x, width: width};
    }
    // create the Graphics that will hold the viewport
    var viewport = new PIXI.Graphics();
    // set a fill and line style
    viewport.beginFill(0x000000);
    viewport.lineStyle(1, 0x000000, 1);
    // draw the port
    var bounds = _viewportBounds(scale);
    viewport.drawRect(0, 0, bounds.width, HEIGHT);
    viewport.endFill();
    viewport.position.x = bounds.x;
    viewport.position.y = y;
    // make the viewport semi-transparent
    viewport.alpha = _FADE;
    // how the viewport is resized
    viewport.resize = function(scale) {
      var bounds = _viewportBounds(scale);
      viewport.position.x = bounds.x;
      viewport.width = bounds.width;
    }
    return viewport;
  }

  /* mouse interaction events */

  var _clickBlock = function (event) {
    this.clickCallback();
  }
  
  var _mousedownName = function (event) {
    // we want to operate at the track level
    var track = this.parent;  // this = track name
    _beginDrag(track);
  }

  var _mouseupName = function (event) {
    // we want to operate at the track level
    var track = this.parent;  // this = track name
    // end dragging the track
    if (track.newY !== undefined) {
      _endDrag(track);
    }
  }

  var _mouseoverBlock = function(event) {
    var track = this.parent.parent;
    // show the tooltip for the block
    _showBlockTip(track, this);
  }

  var _mouseoverName = function (event) {
    var track = this.parent;
    var table = track.parent;
    var tracks = table.children;
    // show the track's tooltips if no track is being dragged
    if (tracks.every(function (element, index, array) {
      return element.newY === undefined;
    })) {
      _showTrackTips(track);
    }
  }

  var _mousemoveName = function (event) {
    var track = this.parent;
    // move the track if it's being dragged
    if (track.newY !== undefined) {
      _drag(event, track);
    }
  }

  var _mouseoutBlock = function(event) {
    var track = this.parent.parent;
    // hide the tooltip for the block
    _hideBlockTip(track, this);
  }

  var _mouseoutName = function (event) {
    var track = this.parent;
    // hide the track's tooltips
    _hideTrackTips(track);
  }

  /* interaction behaviors */

  // how track dragging begins
  var _beginDrag = function(track) {
    // the track's new y coordinate will be computed as it's dragged
    track.newY = track.position.y;
    // bring the row being dragged to the front
    var children = track.parent.children;
    children.splice(children.indexOf(track), 1);
    children.push(track);
  }

  // dragging a track
  var _drag = function (event, track) {
    var newY = track.newY;
    // update the track's position according to the mouse's location
    var table = track.parent;
    var dragY = event.data.getLocalPosition(table).y;
    // make sure the new position is within the bounds of the "table"
    if (dragY >= 0 && dragY + track.height <= table.height) {
      track.position.y = dragY;
    }
    // move other tracks as they're dragged over
    for (var i = 0; i < table.children.length; i++) {
      var child = table.children[i];
      if (child != track) {
        var childY = child.position.y;
        // if the track was dragged DOWN past the child
        if (childY + (child.height / 2) < dragY && childY > newY) {
          // update the track being dragged
          track.newY = (childY + child.height) - track.height;
          // update the track being dragged over
          child.position.y = newY;
        // if the track was dragged UP past the child
        } else if (childY + (child.height / 2) > dragY && childY < newY) {
          // update the track being dragged
          track.newY = childY;
          // update the track being dragged over
          child.position.y = (newY + track.height) - child.height;
        }
      }
    }
  }

  // stop dragging a track
  var _endDrag = function (track) {
    // if the track wasn't dragged then it was clicked
    if (track.position.y == track.newY) {
      track.name.clickCallback();
    } else {
      // put the track in its new position
      track.position.y = track.newY;
    }
    // discard dragging specific data
    track.newY = undefined;
  }

  // shows a single tooltip
  var _showTip = function (track, block) {
    track.addChild(block.tip);
  }

  // fades all the tracks and blocks in the given lists
  var _fade = function(tracks, blocks) {
    for (var i = 0; i < tracks.length; i++) {
      var track = tracks[i];
      track.alpha = _FADE;
    }
    for (var i = 0; i < blocks.length; i++) {
      var block = blocks[i];
      block.alpha = _FADE;
    }
  }

  // shows a block's tooltip and fades all other blocks / tracks
  var _showBlockTip = function(track, block) {
    var table = track.parent;
    // create a list of tracks that doesn't contain track
    var tracks = table.children.filter(function (t) { return t != track; });
    // create a list of blocks that doesn't contain the block
    var blocks = track.blocks.filter(function (b) { return b != block; });
    // fade all the remaining tracks
    _fade(tracks, blocks);
    // draw the block's tooltip
    _showTip(track, block);
  }

  // show a track's tooltips and fade the other tracks
  var _showTrackTips = function (track) {
    var table = track.parent;
    // create a list of tracks that doesn't contain track
    var tracks = table.children.filter(function (t) { return t != track; });
    // fade all the remaining tracks
    _fade(tracks, []);
    // draw tooltips for each of the track's blocks
    var blocks = track.blocks;
    for (var i = 0; i < blocks.length; i++) {
      _showTip(track, blocks[i]);
    }
  }

  // hides a single tooltip
  var _hideTip = function (track, block) {
    track.removeChild(block.tip);
  }

  // unfades all the tracks and blocks in the given lists
  var _unfade = function (tracks, blocks) {
    for (var i = 0; i < tracks.length; i++) {
      var track = tracks[i];
      track.alpha = 1;
    }
    for (var i = 0; i < blocks.length; i++) {
      var block = blocks[i];
      block.alpha = 1;
    }
  }

  // hides a block's tooltip and fades all other blocks / tracks
  var _hideBlockTip = function(track, block) {
    var table = track.parent;
    // create a list of tracks that doesn't contain track
    var tracks = table.children.filter(function (t) { return t != track; });
    // create a list of blocks that doesn't contain the block
    var blocks = track.blocks.filter(function (b) { return b != block; });
    // fade all the remaining tracks
    _unfade(tracks, blocks);
    // draw the block's tooltip
    _hideTip(track, block);
  }

  // hide a track's tooltips and show the other tracks
  var _hideTrackTips = function (track) {
    var table = track.parent;
    // create a list of tracks that doesn't contain track
    var tracks = table.children.filter(function (t) { return t != track; });
    // unfade all the remaining tracks
    _unfade(tracks, []);
    // remove the track's tooltips
    var blocks = track.blocks;
    for (var i = 0; i < blocks.length; i++) {
      _hideTip(track, blocks[i]);
    }
  }

  /* public */

  // draws a synteny view
  var draw = function (elementId, data, options) {
    // parse optional parameters
    var options = options || {};
    var nameClick = options.nameClick || function () { };
    var blockClick = options.blockClick || function () { };
    // get the dom element that will contain the view
    var container = document.getElementById(elementId);
    // width and height used to initially draw the view
    var w = container.clientWidth;
    var h = container.offsetHeight;
    // prefer WebGL renderer, but fallback to canvas
    var args = {antialias: true, transparent: true};
    var renderer = PIXI.autoDetectRenderer(w, h, args);
    // add the renderer drawing element to the dom
    container.appendChild(renderer.view);
    // create the root container of the scene graph
    var stage = new PIXI.Container();
    // the dimensions of a track
    var HEIGHT = 11;
    var PADDING = 2;
    var LENGTH = data.length;
    // the bounds of the tracks "table"
    var NAME_OFFSET = 100;
    var right = 10;
    var scale = (w - (NAME_OFFSET + right)) / data.length;
    // draw the query position ruler
    var ruler = _ruler(
      data.chromosome,
      LENGTH,
      scale,
      NAME_OFFSET,
      HEIGHT,
      PADDING
    );
    ruler.position.y = PADDING;
    stage.addChild(ruler);
    // create a container for the tracks "table"
    var table = new PIXI.Container();
    // draw the tracks
    var tallestTip = 0;
    for (var i = 0; i < data.tracks.length; i++) {
      // the track's color
      var c = _colors[i % _colors.length];
      // create the track
      var track = _track(
        scale,
        NAME_OFFSET,
        HEIGHT,
        PADDING,
        c,
        data.tracks[i],
        nameClick,
        blockClick
      );
      tallestTip = Math.max(tallestTip, track.tallestTip);
      // position the track relative to the "table"
      track.position.y = table.height;
      // bestow the track its data
      track.data = data.tracks[i];
      // draw the track
      table.addChild(track);
    }
    // position the table relative to the ruler
    tableY = ruler.position.y + ruler.height + (3 * PADDING);
    table.position.y = tableY;
    // draw the table
    stage.addChild(table);
    // draw the viewport for the context currently being viewed
    var viewport;
    if (options.viewport !== undefined) {
      viewport = _viewport(
        options.viewport.start,
        options.viewport.stop,
        NAME_OFFSET,
        scale,
        tableY,
        table.height
      );
      stage.addChild(viewport);
    }
    // change the height of the container to match its content
    h = table.position.y + table.height + tallestTip;
    renderer.resize(w, h);
    // run the render loop
    animate();
    // how to animate the view
    function animate () {
      renderer.render(stage);
      requestAnimationFrame(animate);
    }
    // create hidden iframe to trigger resize events
    var iframe = document.createElement('IFRAME');
    iframe.setAttribute('allowtransparency', true);
    iframe.style.width = '100%';
    iframe.style.height = '0';
    iframe.style.position = 'absolute';
    iframe.style.border = 'none';
    iframe.style.backgroundColor = 'transparent';
    container.appendChild(iframe);
    var redraw = function() {
      // resize the renderer
      var w = container.clientWidth;
      renderer.resize(w, h);
      // the new scale for for the coordinate system
      var scale = (w - (NAME_OFFSET + right)) / data.length;
      // resize the ruler
      ruler.resize(scale);
      // resize the tracks
      for (var i = 0; i < table.children.length; i++) {
        table.children[i].resize(scale);
      }
      // resize the viewport
      if (viewport !== undefined) {
        viewport.resize(scale);
      }
    }
    // listen to the iframe's content window for resize events
    iframe.contentWindow.onresize = function (event) {
      redraw();
    }
    // redraw once just in case a scroll bar appeared
    redraw();
  }

  // revealing module pattern
  return {
    draw: draw
  };
})(PIXI);
