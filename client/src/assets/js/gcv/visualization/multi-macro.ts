import { d3 } from "./d3";
import * as Circos from "circos";

export class MultiMacro {
  constructor(el, data, options) {
    this.drawCircos(el, data.chromosomes, data.blocks);
  }

  /*
  * container - where to draw the viewer
  * chromosome - ./data/chromosomes.json
  * data - ./data/blocks.csv
  */
  private drawCircos(container, chromosomes, data): void {
    var width = 960;
    var circos = new Circos({
      container: container,
      width: width,
      height: width
    })

    var colors = {};
    for (var i = 0; i < chromosomes.length; i++) {
      var id = chromosomes[i].id,
          color = chromosomes[i].color;
          colors[id] = color;
        }

        var blocks = data.map(function (d) {
          return {
            block_id: d.target_id,
            source_id: d.source_id,
            start: d.target_begin,
            end: d.target_end
          };
        });

        var chords = data.map(function (d) {
          return {
            source: {
              id: d.source_id,
              start: parseInt(d.source_begin),
              end: parseInt(d.source_end)
            },
            target: {
              id: d.target_id,
              start: parseInt(d.target_begin),
              end: parseInt(d.target_end)
            }
          };
        })

        var highlight = chromosomes.map(function(d) {
          return {
            block_id: d.id,
            start: parseInt(d.start),
            end: parseInt(d.end)
          };
        });

        var chordInnerRadius = width/2 - 100,
        chordOuterRadius = width/2 - 80,
        stackInnerRadius = chordOuterRadius + 5,
        stackOuterRadius = width/2;

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

        var chordSelection = d3.selectAll('.chord');
        var tileSelection = d3.selectAll('.stack > .block > .tile');

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
