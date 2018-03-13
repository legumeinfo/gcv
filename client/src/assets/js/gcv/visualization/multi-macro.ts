import { d3 } from "./d3";
import * as Circos from "circos";
import ResizeObserver from 'resize-observer-polyfill';

export class MultiMacro {

  private container: any;
  private options: any;
  private data: any;
  private circos: any;
  private resizeTimer: any;

  constructor(el, multiMacroTracks, options) {
    this.container = el;
    this.parseOptions(options);
    this.parseData(multiMacroTracks);
    this.drawCircos();
    if (this.options.autoResize) {
      this.autoResize();
    }
  }

  private parseOptions(options): void {
    this.options = options || {};
    this.options.autoResize = this.options.autoResize || false;
    this.options.resizeDelay = this.options.resizeDelay || 250;
    this.options.highlight = this.options.highlight || [];
    this.options.replicateBlocks = this.options.replicateBlocks || false;
    if (this.options.colors === undefined) {
      this.options.colors = ((s) => "#cfcfcf");
    }
  }

  private parseData(multiMacroTracks) {
    // parse the tracks into Circos compatible data
    const chromosomeIDs = multiMacroTracks.map((t) => t.chromosome);
    this.data = {
      colors: {},
      chromosomes: [],
      blocks: [],
      chords: [],
      // compute which parts of each chromosome should be highlighted
      highlight: this.options.highlight
        .filter((d) => chromosomeIDs.indexOf(d.chromosome) > -1)
        .map(function(d) {
          return {
            block_id: d.chromosome,
            start: d.start,
            end: d.stop
          };
        }),
    };
    // convert each chromosome's MacroTracks into a slice of the circle
    for (let i = 0; i < multiMacroTracks.length; i++) {
      const macroTracks = multiMacroTracks[i];
      const name = macroTracks.genus + " " + macroTracks.species;
      const target_id = macroTracks.chromosome;
      this.data.colors[target_id] = this.options.colors(name);
      // parse the chromosome
      this.data.chromosomes.push({
        id: target_id,
        label: target_id,
        color: this.options.colors(name),
        len: macroTracks.length,
      });
      // parse each track's blocks
      for (let j = 0; j < macroTracks.tracks.length; j++) {
        const macroTrack = macroTracks.tracks[j];
        const source_id = macroTrack.chromosome;
        for (let k = 0; k < macroTrack.blocks.length; k++) {
          // don't draw blocks/chords for chromosomes that haven't been loaded
          if (chromosomeIDs.indexOf(source_id) === -1) {
            continue;
          }
          // parse blocks
          const block = macroTrack.blocks[k];
          this.data.blocks.push({
            block_id: target_id,
            source_id: source_id,
            start: block.query_start,
            end: block.query_stop,
            source_start: block.start,
            source_end: block.stop,
          });
          // replicate the block for the source
          if (this.options.replicateBlocks) {
            this.data.blocks.push({
              block_id: source_id,
              source_id: target_id,
              start: block.start,
              end: block.stop,
              source_start: block.query_start,
              source_end: block.query_stop,
            });
          }
          // parse chords
          this.data.chords.push({
            source: {
              id: source_id,
              start: block.start,
              end: block.stop,
            },
            target: {
              id: target_id,
              start: block.query_start,
              end: block.query_stop,
            }
          });
          // replicate chords for replicated blocks
          if (this.options.replicateBlocks) {
            this.data.chords.push({
              source: {
                id: target_id,
                start: block.query_start,
                end: block.query_stop,
              },
              target: {
                id: source_id,
                start: block.start,
                end: block.stop,
              }
            });
          }
        }
      }
    }
  }

  // draw the diagram
  private drawCircos() {
    const width = Math.min(this.container.clientWidth, this.container.clientHeight);
    this.circos = new Circos({
      container: this.container,
      width: width,
      height: width
    });

    const chordInnerRadius = width / 2 - 100;
    const chordOuterRadius = width / 2 - 80;
    const stackInnerRadius = chordOuterRadius + 5;
    const stackOuterRadius = width / 2;

    this.circos
      .layout(this.data.chromosomes, {
        innerRadius: chordInnerRadius,
        outerRadius: chordOuterRadius,
        labels: {
          radialOffset: 5,
        },
        ticks: {
          display: true,
          labels: false,
          spacing: 1000000
        },
        events: {
          'mouseover': function (d, i, nodes, event) {
            layoutMouseover(d, i);
          },
          'mouseout': function (d, i, nodes, event) {
            mouseout(d, i);
          }
        }
      })
      .stack('stack', this.data.blocks, {
        innerRadius: stackInnerRadius,
        outerRadius: stackOuterRadius,
        thickness: 4,
        margin: 0.01 * length,
        direction: 'out',
        strokeWidth: 0,
        color: (d) => {
          return this.data.colors[d.source_id];
        },
        tooltipContent: null,
        events: {
          'mouseover': function (d, i, nodes, event) {
            stackMouseover(d, i);
          },
          'mouseout': function (d, i, nodes, event) {
            mouseout(d, i);
          }
        }
      })
      .chords('l1', this.data.chords, {
        logScale: false,
        tooltipContent: null,
      })
      .highlight('cytobands', this.data.highlight, {
        innerRadius: chordInnerRadius,
        outerRadius: chordOuterRadius,
        opacity: 0.5,
        color: '#000000',
        tooltipContent: null,
      })
      .render()

    // TODO: add GCV data attributes

    // mouse events
    // TODO: make selections specific to this visualization
    const chordSelection = d3.selectAll('.chord');
    const tileSelection = d3.selectAll('.stack > .block > .tile');

    function layoutMouseover(d, i) {
      chordSelection.classed('fade', function(c) {
        return d.id !== c.source.id;
      });
      tileSelection.classed('fade', function(b) {
        return d.id !== b.source_id && d.id !== b.block_id;
      });
    }

    function stackMouseover(d, i) {
      chordSelection.classed('fade', function(c) {
        return !(d.source_id === c.source.id && d.block_id === c.target.id &&
                 d.start === c.target.start && d.end === c.target.end);
      });
      tileSelection.classed('fade', function(b) {
        return !(d === b || (d.source_id === b.block_id && d.block_id === b.source_id &&
                 d.source_start === b.start && d.source_end === b.end));
      });
    }

    function mouseout(d, i) {
      chordSelection.classed('fade', false);
      tileSelection.classed('fade', false);
    }
  }

  // TODO: clearTimeout doesn't appear to be working due to a scoping issue
  // NOTE: is there a more efficient way to resize other than redrawing?
  private autoResize() {
    const scope = this;
    const ro = new ResizeObserver((entries) => {
      clearTimeout(this.resizeTimer);
      const id = this.resizeTimer = setTimeout(() => {
        const width = Math.min(this.container.clientWidth, this.container.clientHeight);
        // NOTE: shouldn't have to check if circos is undefined if scope is correct...
        if (this.circos !== undefined && this.circos.conf.width !== width) {
          this.destroy();
          this.drawCircos();
        }
      }, this.options.resizeDelay);
    });
    ro.observe(this.container);
  }

  destroy() {
    // TODO: remove only elements added by Circos
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
    this.circos = undefined;
  }
}
