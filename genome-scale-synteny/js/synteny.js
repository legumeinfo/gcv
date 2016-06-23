var Synteny = (function (PIXI) {

  // 100 maximally distinct colors
  var _colors = [0x7A2719, 0x5CE33C, 0xE146E9, 0x64C6DE, 0xE8B031, 0x322755, 0x436521, 0xDE8EBA, 0x5C77E3, 0xCEE197, 0xE32C76, 0xE54229, 0x2F2418, 0xE1A782, 0x788483, 0x68E8B2, 0x9E2B85, 0xE4E42A, 0xD5D9D5, 0x76404F, 0x589BDB, 0xE276DE, 0x92C535, 0xDE6459, 0xE07529, 0xA060E4, 0x895997, 0x7ED177, 0x916D46, 0x5BB0A4, 0x365167, 0xA4AE89, 0xACA630, 0x38568F, 0xD2B8E2, 0xAF7B23, 0x81A158, 0x9E2F55, 0x57E7E1, 0xD8BD70, 0x316F4B, 0x5989A8, 0xD17686, 0x213F2C, 0xA6808E, 0x358937, 0x504CA1, 0xAA7CDD, 0x393E0D, 0xB02828, 0x5EB381, 0x47B033, 0xDF3EAA, 0x4E191E, 0x9445AC, 0x7A691F, 0x382135, 0x709628, 0xEF6FB0, 0x603719, 0x6B5A57, 0xA44A1C, 0xABC6E2, 0x9883B0, 0xA6E1D3, 0x357975, 0xDC3A56, 0x561238, 0xE1C5AB, 0x8B8ED9, 0xD897DF, 0x61E575, 0xE19B55, 0x1F303A, 0xA09258, 0xB94781, 0xA4E937, 0xEAABBB, 0x6E617D, 0xB1A9AF, 0xB16844, 0x61307A, 0xED8B80, 0xBB60A6, 0xE15A7F, 0x615C37, 0x7C2363, 0xD240C2, 0x9A5854, 0x643F64, 0x8C2A36, 0x698463, 0xBAE367, 0xE0DE51, 0xBF8C7E, 0xC8E6B6, 0xA6577B, 0x484A3A, 0xD4DE7C, 0xCD3488];
  
  // greedy interval scheduling algorithm for grouping track blocks
  var _createRows = function (blocks) {
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
  var _createTrack = function (renderer, LENGTH, SCALE, NAME_OFFSET, HEIGHT,
  PADDING, COLOR, track, nameClick) {
    var POINTER_LENGTH = 5;
    // create the rows for the track
    var rows = _createRows(track.blocks);
    // where the blocks will be drawn
    var blocks = new PIXI.Graphics();
    // set a fill and line style
    blocks.beginFill(COLOR);
    blocks.lineStyle(1, COLOR, 1);
    // draw each row in the track
    for (var i = 0; i < rows.length; i++) {
      var iBlocks = rows[i];
      var yOffset = (HEIGHT + PADDING) * i + PADDING;  // vertical
      // draw each block in the row
      for (var k = 0; k < iBlocks.length; k++) {
        var b = iBlocks[k];
        // create the polygon points of the block
        var points = [  // x, y coordinates of block
          SCALE * b.start, yOffset,
          SCALE * b.stop, yOffset,
          SCALE * b.stop, yOffset + HEIGHT,
          SCALE * b.start, yOffset + HEIGHT
        ];
        // add the orientation pointer
        var middle = yOffset + (HEIGHT / 2);
        if (b.orientation == '+') {
          points[2] -= POINTER_LENGTH;
          points[4] -= POINTER_LENGTH;
          points.splice(4, 0, (SCALE * b.stop), middle);
        } else if (b.orientation == '-') {
          points[0] += POINTER_LENGTH;
          points[6] += POINTER_LENGTH;
          points.push((SCALE * b.start), middle);
        }
        // create the polygon
        blocks.drawPolygon(points);
      }
    }
    blocks.endFill();
    // create a render texture so the blocks can be rendered as a sprite
    var h = blocks.getBounds().height;
    var w = SCALE * LENGTH;
    var blocksTexture = new PIXI.RenderTexture(renderer, w, h);
    blocksTexture.render(blocks);
    // render the blocks as a sprite
    var blocksSprite = new PIXI.Sprite(blocksTexture);
    blocksSprite.position.x = NAME_OFFSET;
    // make the blocksSprite interactive so we can capture mouse events
    blocksSprite.interactive = true;
    // make the cursor a pointer when it rolls over the track
    blocksSprite.buttonMode = true;
    // setup the interaction events
    blocksSprite
      // begin dragging track
      .on('mousedown', _beginDrag)
      .on('touchstart', _beginDrag)
      // stop dragging track
      .on('mouseup', _endDrag)
      .on('touchend', _endDrag)
      .on('mouseupoutside', _endDrag)
      .on('touchendoutside', _endDrag)
      // track being dragged
      .on('mouseover', _drag)
      .on('mousemove', _drag)
    // create the track name
    var args = {font : HEIGHT + 'px Arial', align : 'right'};
    var label = new PIXI.Text(track.chromosome, args);
    // position it next to the blocks
    label.position.x = NAME_OFFSET - (label.width + (2 * PADDING));
    label.position.y = (blocks.height - label.height) / 2;
    // make it interactive
    label.interactive = true;
    label.buttonMode = true;
    label.click = function (event) { nameClick(); };
    // add the label and blocks to a container
    var container = new PIXI.Container();
    container.addChild(label);
    container.addChild(blocksSprite);
    return container;
  }

  // creates the query ruler graphic
  var _createRuler = function (chromosome, LENGTH, SCALE, NAME_OFFSET, HEIGHT,
  PADDING) {
    // create the Graphics that will hold the ruler
    var ruler = new PIXI.Graphics();
    // add the query name
    var args = {font : 'bold ' + HEIGHT + 'px Arial', align : 'right'};
    var label = new PIXI.Text(chromosome, args);
    label.position.x = NAME_OFFSET - (label.width + (2 * PADDING));
    label.position.y = HEIGHT / 2;
    ruler.addChild(label);
    // draw the ruler
    ruler.lineStyle(1, 0x000000, 1);
    ruler.moveTo(NAME_OFFSET, HEIGHT);
    ruler.lineTo(NAME_OFFSET, HEIGHT / 2);
    var right = NAME_OFFSET + (LENGTH * SCALE);
    ruler.lineTo(right, HEIGHT / 2);
    ruler.lineTo(right, HEIGHT);
    ruler.endFill();
    // add the genome length labels
    var start = new PIXI.Text('0', args);
    start.position.x = NAME_OFFSET;
    start.position.y = HEIGHT;
    ruler.addChild(start);
    var stop = new PIXI.Text(LENGTH, args);
    stop.position.x = right - stop.width;
    stop.position.y = HEIGHT;
    ruler.addChild(stop);
    return ruler;
  }

  var _createViewport = function (start, stop, SCALE, y, HEIGHT) {
    // create the Graphics that will hold the viewport
    var viewport = new PIXI.Graphics();
    // set a fill and line style
    viewport.beginFill(0x000000);
    viewport.lineStyle(1, 0x000000, 1);
    // draw the port
    var x = SCALE * start;
    var width = (SCALE * stop) - x;
    viewport.drawRect(x, y, width, HEIGHT);
    viewport.endFill();
    // make the viewport semi-transparent
    viewport.alpha = 0.2;
    return viewport;
  }

  // draws a synteny view
  var draw = function (elementId, data, options) {
    // parse optional parameters
    var options = options || {};
    var nameClick = options.nameClick || function() { };
    // get the dom element that will contain the view
    var container = document.getElementById(elementId);
    // width and height used to initially draw the view
    var w = container.offsetWidth;
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
    // the bounds of the tracks "table"
    var NAME_OFFSET = 100;
    var right = 10;
    var SCALE = (w - (NAME_OFFSET + right)) / data.length;
    // draw the query position ruler
    var ruler = _createRuler(
      data.chromosome,
      data.length,
      SCALE,
      NAME_OFFSET,
      HEIGHT,
      PADDING
    );
    ruler.position.y = PADDING;
    stage.addChild(ruler);
    // create a container for the tracks "table"
    var table = new PIXI.Container();
    // draw the tracks
    for (var i = 0; i < data.tracks.length; i++) {
      // the track's color
      var c = _colors[i % _colors.length];
      // create the track
      var track = _createTrack(
        renderer,
        data.length,
        SCALE,
        NAME_OFFSET,
        HEIGHT,
        PADDING,
        c,
        data.tracks[i],
        nameClick
      );
      // position the track relative to the "table"
      track.position.y = table.height;
      // draw the track
      table.addChild(track);
    }
    // position the table
    // TODO: use ruler, rather than hard coding
    //table.position.y = ruler.y + ruler.height + (2 * padding);
    var table_y = (2 * HEIGHT) + (2 * PADDING);
    table.position.y = table_y;
    // draw the table
    stage.addChild(table);
    // draw the viewport for the context currently being viewed
    if (options.viewport !== undefined) {
      var viewport = _createViewport(
        options.viewport.start,
        options.viewport.stop,
        SCALE,
        table_y,
        table.height
      );
      stage.addChild(viewport);
    }
    // run the render loop
    animate();
    // how to animate the view
    function animate () {
      renderer.render(stage);
      requestAnimationFrame(animate);
    }
    // resize the renderer with the dom container
    container.onresize = function (event) {
      var w = container.innerWidth;
      var h = container.innerHeight;
      // resize the canvas but keeps ratio the same
      renderer.view.style.width = w + "px";
      renderer.view.style.height = h + "px";
      // adjust the ratio
      renderer.resize(w, h);
    }
  }
  
  // start dragging a track
  var _beginDrag = function (event) {
    // we want to move the entire track, not just the blocks
    var track = this.parent;
    // the track's new y coordinate will be computed as it's dragged
    track.newY = track.position.y;
    // fade the track
    track.alpha = 0.5;
    // bring the row being dragged to the front
    var children = track.parent.children;
    children.splice(children.indexOf(track), 1);
    children.push(track);
  }

  // dragging a track
  var _drag = function (event) {
    var track = this.parent;
    // if the track is being dragged
    if (track.newY !== undefined) {
      var newY = track.newY;
      // update the track's position according to the mouse's location
      var table = track.parent;
      var dragY = event.data.getLocalPosition(table).y;
      // TODO: fix so this actually bounds the bottom correctly
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
  }

  // stop dragging a track
  var _endDrag = function (event) {
    var track = this.parent;
    if (track.newY !== undefined) {
      // unfade the track
      track.alpha = 1;
      // put the track in its new position
      track.position.y = track.newY;
      // discard dragging specific data
      track.newY = undefined;
    }
  }

  // revealing module pattern
  return {
    draw: draw
  };
})(PIXI);
