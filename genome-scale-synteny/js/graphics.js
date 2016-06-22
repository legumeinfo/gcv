// 100 maximally distinct colors
var colors = [0x7A2719, 0x5CE33C, 0xE146E9, 0x64C6DE, 0xE8B031, 0x322755, 0x436521, 0xDE8EBA, 0x5C77E3, 0xCEE197, 0xE32C76, 0xE54229, 0x2F2418, 0xE1A782, 0x788483, 0x68E8B2, 0x9E2B85, 0xE4E42A, 0xD5D9D5, 0x76404F, 0x589BDB, 0xE276DE, 0x92C535, 0xDE6459, 0xE07529, 0xA060E4, 0x895997, 0x7ED177, 0x916D46, 0x5BB0A4, 0x365167, 0xA4AE89, 0xACA630, 0x38568F, 0xD2B8E2, 0xAF7B23, 0x81A158, 0x9E2F55, 0x57E7E1, 0xD8BD70, 0x316F4B, 0x5989A8, 0xD17686, 0x213F2C, 0xA6808E, 0x358937, 0x504CA1, 0xAA7CDD, 0x393E0D, 0xB02828, 0x5EB381, 0x47B033, 0xDF3EAA, 0x4E191E, 0x9445AC, 0x7A691F, 0x382135, 0x709628, 0xEF6FB0, 0x603719, 0x6B5A57, 0xA44A1C, 0xABC6E2, 0x9883B0, 0xA6E1D3, 0x357975, 0xDC3A56, 0x561238, 0xE1C5AB, 0x8B8ED9, 0xD897DF, 0x61E575, 0xE19B55, 0x1F303A, 0xA09258, 0xB94781, 0xA4E937, 0xEAABBB, 0x6E617D, 0xB1A9AF, 0xB16844, 0x61307A, 0xED8B80, 0xBB60A6, 0xE15A7F, 0x615C37, 0x7C2363, 0xD240C2, 0x9A5854, 0x643F64, 0x8C2A36, 0x698463, 0xBAE367, 0xE0DE51, 0xBF8C7E, 0xC8E6B6, 0xA6577B, 0x484A3A, 0xD4DE7C, 0xCD3488]

// greedy interval scheduling algorithm for grouping track blocks
function createRows(blocks) {
  // create a copy so there are no side effects
  var ordered_blocks = blocks.slice();
  // reverse sort by stop location so we can remove elements during iteration
  ordered_blocks.sort(function(a, b) {
    return b.stop - a.stop;
  });
  // create track rows
  var rows = [];
  while (ordered_blocks.length > 0) {
    // the first block to stop will start the row
    var row = ordered_blocks.splice(ordered_blocks.length - 1, 1);
    var k = 0;
    // iteratively add blocks whose starts don't overlap with the last stop
    for (var i = ordered_blocks.length - 1; i >= 0; i--) {
      if (ordered_blocks[i].start > row[k].stop) {
        row.push.apply(row, ordered_blocks.splice(i, 1));
        k++;
      }
    }
    rows.push(row);
  }
  return rows;
}

// width and height used to initially draw the view
// TODO: make dimensions relative to containing element
var w = window.innerWidth;
var h = window.innerHeight;

// prefer WebGL renderer, but fallback to canvas
var renderer = PIXI.autoDetectRenderer(w, h, {antialias: true, transparent: true});

// create a canvas element and add it to the dom
// TODO: append to containing element
document.body.appendChild(renderer.view);

// create the root container of the scene graph
var stage = new PIXI.Container();

// the bounds of the tracks "table"
var table_top = 10;
var table_bottom = table_top;

// draws a track's blocks
function drawTrack(i, track) {
  // create the rows for the track
  var rows = createRows(track.blocks);
  // the dimensions of a track
  var height = 10;
  var padding = 2;
  // where the track will be drawn
  var graphics = new PIXI.Graphics();
  // set a fill and line style
  var c = colors[i % colors.length];
  graphics.beginFill(c);
  graphics.lineStyle(1, c, 1);
  // draw each row in the track
  for (var j = 0; j < rows.length; j++) {
    var blocks = rows[j];
    var offset = (height + padding) * j + padding;
    // draw each block in the row
    for (var k = 0; k < blocks.length; k++) {
      var b = blocks[k];
      // create the polygon points of the block
      var points = [  // x, y coordinates of block
        b.start, offset,
        b.stop, offset,
        b.stop, offset+height,
        b.start, offset+height
      ];
      // add the orientation pointer
      var middle = offset + (height / 2);
      if (b.orientation == '+') {
        points.splice(4, 0, b.stop + 5, middle);
      } else if (b.orientation == '-') {
        points.push(b.start - 5, middle);
      }
      // create the polygon
      graphics.drawPolygon(points);
    }
  }
  graphics.endFill();
  // create a render texture so the track can be rendered as a sprite
  var bounds = graphics.getBounds();
  var texture = new PIXI.RenderTexture(renderer, bounds.width, bounds.height);
  texture.render(graphics);
  // render the track as a sprite
  var sprite = new PIXI.Sprite(texture);
  // position the track in the "table"
  sprite.position.y = table_bottom;
  // make the sprite interactive so we can capture mouse events
  sprite.interactive = true;
  // make the cursor a pointer when it rolls over the track
  sprite.buttonMode = true;
  // setup the interaction events
  sprite
    // begin dragging track
    .on('mousedown', mousedown)
    .on('touchstart', mousedown)
    // stop dragging track
    .on('mouseup', mouseup)
    .on('touchend', mouseup)
    .on('mouseupoutside', mouseup)
    .on('touchendoutside', mouseup)
    // track being dragged
    .on('mouseover', mousemove)
    .on('mousemove', mousemove)
  // add the track to the view
  stage.addChild(sprite);
  // adjust the bottom of the track "table"
  table_bottom += (height + padding) * rows.length + padding;
}

// draw all the tracks
var tracks = [
  {chromosome: 'name', blocks: [{start:620, stop:700, orientation:'-'}, {start:520, stop:600, orientation:'+'}, {start:10, stop:500, orientation:'-'}]},
  {chromosome: 'name', blocks: [{start:620, stop:700, orientation:'-'}, {start:520, stop:600, orientation:'+'}, {start:10, stop:500, orientation:'-'}]},
  {chromosome: 'name', blocks: [{start:620, stop:700, orientation:'-'}, {start:520, stop:600, orientation:'+'}, {start:10, stop:500, orientation:'-'},
                                {start:570, stop:650, orientation:'+'}, {start:470, stop:550, orientation:'-'}, {start:60, stop:450, orientation:'+'}]},
  {chromosome: 'name', blocks: [{start:620, stop:700, orientation:'-'}, {start:520, stop:600, orientation:'+'}, {start:10, stop:500, orientation:'-'}]},
  {chromosome: 'name', blocks: [{start:620, stop:700, orientation:'-'}, {start:520, stop:600, orientation:'+'}, {start:10, stop:500, orientation:'-'}]},
  {chromosome: 'name', blocks: [{start:620, stop:700, orientation:'-'}, {start:520, stop:600, orientation:'+'}, {start:10, stop:500, orientation:'-'}]},
  {chromosome: 'name', blocks: [{start:620, stop:700, orientation:'-'}, {start:520, stop:600, orientation:'+'}, {start:10, stop:500, orientation:'-'}]},
  {chromosome: 'name', blocks: [{start:620, stop:700, orientation:'-'}, {start:520, stop:600, orientation:'+'}, {start:10, stop:500, orientation:'-'},
                                {start:570, stop:650, orientation:'+'}, {start:470, stop:550, orientation:'-'}, {start:60, stop:450, orientation:'+'}]},
  {chromosome: 'name', blocks: [{start:620, stop:700, orientation:'-'}, {start:520, stop:600, orientation:'+'}, {start:10, stop:500, orientation:'-'}]},
  {chromosome: 'name', blocks: [{start:620, stop:700, orientation:'-'}, {start:520, stop:600, orientation:'+'}, {start:10, stop:500, orientation:'-'}]}
];

for (var i = 0; i < tracks.length; i++) {
  drawTrack(i, tracks[i]);
}

// run the render loop
animate();

// how to animate the view
function animate() {
  renderer.render(stage);
  requestAnimationFrame(animate);
}

// resize the renderer with the window
window.onresize = function(event) {
  var w = window.innerWidth;
  var h = window.innerHeight;
  // resize the canvas but keeps ratio the same
  renderer.view.style.width = w + "px";
  renderer.view.style.height = h + "px";
  // adjust the ratio
  renderer.resize(w, h);
}

// object interaction functions
function mousedown(event) {
  // the track's new y coordinate will be computed as it's dragged
  this.new_y = this.position.y;
  // fade the track
  this.alpha = 0.5;
  // bring the row being dragged to the front
  var children = this.parent.children;
  children.splice(children.indexOf(this), 1);
  children.push(this);
}
function mousemove(event) {
  // if the track is being dragged
  if (this.new_y !== undefined)
  {
    var new_y = this.new_y;
    // update the track's position according to the mouse's location
    var drag_y = event.data.getLocalPosition(this.parent).y;
    if (drag_y >= table_top && drag_y + this.height <= table_bottom) {
      this.position.y = drag_y;
    }
    // move other tracks as they're dragged over
    for (var i = 0; i < this.parent.children.length; i++) {
      var child = this.parent.children[i];
      if (child != this) {
        var child_y = child.position.y;
        // if the track was dragged DOWN past the child
        if (child_y + (child.height / 2) < drag_y && child_y > new_y) {
          // update the track being dragged
          this.new_y = (child_y + child.height) - this.height;
          // update the track being dragged over
          child.position.y = new_y;
        // if the track was dragged UP past the child
        } else if (child_y + (child.height / 2) > drag_y && child_y < new_y) {
          // update the track being dragged
          this.new_y = child_y;
          // update the track being dragged over
          child.position.y = (new_y + this.height) - child.height;
        }
      }
    }
  }
}
function mouseup() {
  if (this.new_y !== undefined) {
    // unfade the track
    this.alpha = 1;
    // put the track in its new position
    this.position.y = this.new_y;
    // discard dragging specific data
    this.new_y = undefined;
  }
}
