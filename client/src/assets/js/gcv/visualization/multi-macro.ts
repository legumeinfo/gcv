import { d3 } from "./d3";
import * as Circos from "circos";

export class MultiMacro {

  private options: any;

  constructor(el, multiMacroTracks, options) {
    this.parseOptions(options);
    this.drawCircos(el, multiMacroTracks, options);
  }

  private parseOptions(options): void {
    this.options = options || {};
    this.options.colors = this.options.colors || ((s) => "#000000");
    this.options.highlight = this.options.highlight || [];
  }

  /*
  * container - where to draw the viewer
  * multiMacroTracks - MacroTracks[]
  * options - {
  *   colors?: (name: string) => string,
  *   highlight?: {chromosome: string, start: number, stop: number}[],
  * }
  */
  private drawCircos(container, multiMacroTracks, options): void {

    // create the diagram
    const width = 960;
    const circos = new Circos({
      container: container,
      width: width,
      height: width
    })

    // parse the tracks into Circos compatible data
    const colors = {};
    const chromosomes = [];
    const blocks = [];
    const chords = [];
    // convert each chromosome's MacroTracks into a slice of the circle
    for (let i = 0; i < multiMacroTracks.length; i++) {
      const macroTracks = multiMacroTracks[i];
      const name = macroTracks.genus + " " + macroTracks.species;
      const target_id = macroTracks.chromosome;
      colors[target_id] = macroTracks.color;
      // parse the chromosome
      chromosomes.push({
        id: target_id,
        label: target_id,
        color: colors[target_id],
        len: macroTracks.length,
      });
      // parse each track's blocks
      for (let j = 0; j < macroTracks.tracks.length; j++) {
        const macroTrack = macroTracks.tracks[j];
        const source_id = macroTrack.chromosome;
        for (let k = 0; k < macroTrack.blocks.length; k++) {
          // parse blocks
          const block = macroTrack.blocks[k];
          blocks.push({
            block_id: target_id,
            source_id: source_id,
            start: block.start,
            end: block.stop
          });
          // parse chords
          chords.push({
            source: {
              id: source_id,
              start: parseInt(block.query_stop),
              end: parseInt(block.query_start)
            },
            target: {
              id: target_id,
              start: parseInt(block.start),
              end: parseInt(block.stop)
            }
          });
        }
      }
    }

    // compute which parts of each chromosome should be highlighted
    const highlight = options.highlight.map(function(d) {
      return {
        block_id: d.chromosome,
        start: parseInt(d.start),
        end: parseInt(d.stop)
      };
    });

    // draw the diagram
    const chordInnerRadius = width / 2 - 100;
    const chordOuterRadius = width / 2 - 80;
    const stackInnerRadius = chordOuterRadius + 5;
    const stackOuterRadius = width / 2;

    circos
      .layout(chromosomes, {
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
            mouseover(d, i);
          },
          'mouseout': function (d, i, nodes, event) {
            mouseout(d, i);
          }
        }
      })
      .stack('stack', blocks, {
        innerRadius: stackInnerRadius,
        outerRadius: stackOuterRadius,
        thickness: 4,
        margin: 0.01 * length,
        direction: 'out',
        strokeWidth: 0,
        color: function (d) {
          return colors[d.source_id];
        },
        showAxesTooltip: false,
        tooltipContent: function (d) {
          return d.start + ' - ' + d.end;
        }
      })
      .chords('l1', chords, {
        logScale: false
      })
      .highlight('cytobands', highlight, {
        innerRadius: chordInnerRadius,
        outerRadius: chordOuterRadius,
        opacity: 0.5,
        color: '#000000'
      })
      .render()

    // mouse events
    const chordSelection = d3.selectAll('.chord');
    const tileSelection = d3.selectAll('.stack > .block > .tile');

    function mouseover(d, i) {
      chordSelection.classed('fade', function(c) {
        return d.id != c.source.id;
      });
      tileSelection.classed('fade', function(b) {
        return d.id != b.source_id;
      });
    }

    function mouseout(d, i) {
      chordSelection.classed('fade', false);
      tileSelection.classed('fade', false);
    }
  }
}
