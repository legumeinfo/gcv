import { d3 } from "./d3";
import * as Circos from "circos";

export class MultiMacro {

  private container: any;
  private options: any;

  constructor(el, multiMacroTracks, options) {
    this.container = el;
    this.parseOptions(options);
    this.drawCircos(el, multiMacroTracks);
  }

  private parseOptions(options): void {
    this.options = options || {};
    this.options.highlight = this.options.highlight || [];
    if (this.options.colors === undefined) {
      this.options.colors = ((s) => "#cfcfcf");
    }
  }

  /*
  * container - where to draw the viewer
  * multiMacroTracks - MacroTracks[]
  * options - {
  *   colors?: (name: string) => string,
  *   highlight?: {chromosome: string, start: number, stop: number}[],
  * }
  */
  private drawCircos(container, multiMacroTracks): void {

    // create the diagram
    const width = 960;
    const circos = new Circos({
      container: container,
      width: width,
      height: width
    });

    // parse the tracks into Circos compatible data
    const chromosomeIDs = multiMacroTracks.map((t) => t.chromosome);
    const colors = {};
    const chromosomes = [];
    const blocks = [];
    const chords = [];
    // convert each chromosome's MacroTracks into a slice of the circle
    for (let i = 0; i < multiMacroTracks.length; i++) {
      const macroTracks = multiMacroTracks[i];
      const name = macroTracks.genus + " " + macroTracks.species;
      const target_id = macroTracks.chromosome;
      colors[target_id] = this.options.colors(name);
      // parse the chromosome
      chromosomes.push({
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
          if (chromosomeIDs.indexOf(source_id) === -1) {
            continue;
          }
          // parse blocks
          const block = macroTrack.blocks[k];
          blocks.push({
            block_id: target_id,
            source_id: source_id,
            start: block.query_start,
            end: block.query_stop
          });
          // parse chords
          chords.push({
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
        }
      }
    }

    // compute which parts of each chromosome should be highlighted
    const highlight = this.options.highlight
      .filter((d) => chromosomeIDs.indexOf(d.chromosome) > -1)
      .map(function(d) {
        return {
          block_id: d.chromosome,
          start: d.start,
          end: d.stop
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

  destroy() {
    // TODO: remove onyl elements added by Circos
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
    //this.circos.conf.container.removeChild(this.circos.svg.node());
    //this.circos = undefined;
  }
}
