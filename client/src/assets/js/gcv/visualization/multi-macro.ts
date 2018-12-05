import { d3 } from "./d3";
import * as Circos from "circos";
import { eventBus } from "../common"
import ResizeObserver from "resize-observer-polyfill";

export class MultiMacro {

  private eventBus;
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
      blocks: [],
      blockSources: chromosomeIDs.reduce((sources, id) => {
        sources[id] = new Set();
        return sources;
      }, {}),
      chords: [],
      chromosomes: [],
      colors: {},
      genusSpecies: multiMacroTracks.reduce((genusSpecies, track) => {
        genusSpecies[track.chromosome] = track.genus + " " + track.species;
        return genusSpecies;
      }, {}),
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
        if (!this.data.blockSources.hasOwnProperty(source_id)) {
          continue;
        }
        this.data.blockSources[target_id].add(source_id);
        this.data.blockSources[source_id].add(target_id);
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
            start: Math.min(block.query_start, block.query_stop),
            end: Math.max(block.query_start, block.query_stop),
            source_start: Math.min(block.start, block.stop),
            source_end: Math.max(block.start, block.stop),
            orientation: block.orientation,
          });
          // replicate the block for the source
          if (this.options.replicateBlocks) {
            this.data.blocks.push({
              block_id: source_id,
              source_id: target_id,
              start: Math.min(block.start, block.stop),
              end: Math.max(block.start, block.stop),
              source_start: Math.min(block.query_start, block.query_stop),
              source_end: Math.max(block.query_start, block.query_stop),
              orientation: block.orientation,
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
    this.eventBus = eventBus.subscribe(this.eventHandler.bind(this));

    const width = Math.min(this.container.clientWidth, this.container.clientHeight);
    this.circos = new Circos({
      container: this.container,
      width: width,
      height: width
    });

    this.circos.svg.attr("class", "GCV");

    const chordInnerRadius = width / 2 - 100;
    const chordOuterRadius = width / 2 - 80;
    const stackInnerRadius = chordOuterRadius + 5;
    const stackOuterRadius = width / 2;

    const publishChromosomeEvent = (type, chromosome) => {
      eventBus.publish({
        type,
        targets: {
          chromosome: chromosome.id,
          organism: this.data.genusSpecies[chromosome.id],
        }
      });
    }

    const publishBlockEvent = (type, block) => {
      eventBus.publish({
        type,
        targets: {
          block: {
            source: {
              chromosome: block.source_id,
              locus: [block.source_start, block.source_end],
            },
            reference: {
              chromosome: block.block_id,
              locus: [block.start, block.end],
            },
            orientation: block.orientation,
          }
        },
      });
    };

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
          "mouseover": (d, i, nodes, event) => publishChromosomeEvent("select", d),
          "mouseout": (d, i, nodes, event) => publishChromosomeEvent("deselect", d),
        }
      })
      .stack("stack", this.data.blocks, {
        innerRadius: stackInnerRadius,
        outerRadius: stackOuterRadius,
        thickness: 4,
        margin: 0.01 * length,
        direction: "out",
        strokeWidth: 0,
        color: (d) => {
          return this.data.colors[d.source_id];
        },
        tooltipContent: null,
        events: {
          "mouseover": (d, i, nodes, event) => publishBlockEvent("select", d),
          "mouseout": (d, i, nodes, event) => publishBlockEvent("deselect", d),
        }
      })
      .chords("l1", this.data.chords, {
        logScale: false,
        tooltipContent: null,
      })
      .highlight("cytobands", this.data.highlight, {
        innerRadius: chordInnerRadius,
        outerRadius: chordOuterRadius,
        tooltipContent: null,
      })
      .render()

    // add GCV data attributes for interactivity
    this.circos.svg.selectAll(".cs-layout > g")
      .attr("data-chromosome", (d) => d && d.id)
      .attr("data-organism", (d) => d && this.data.genusSpecies[d.id]);
    this.circos.svg.selectAll(".chord")
      .attr("data-chromosome", (d) => d.source.id)
      .attr("data-reference-chromosome", (d) => d.target.id)
      .attr("data-locus", (d) => {
        return [d.source.start, d.source.end].sort((a, b) => a - b).join(":");
      })
      .attr("data-reference-locus", (d) => {
        return [d.target.start, d.target.end].sort((a, b) => a - b).join(":");
      })
      .attr("data-orientation", (d) => d.orientation)
      .attr("data-organism", (d) => d && this.data.genusSpecies[d.source_id]);
    this.circos.svg.selectAll(".stack > .block > .tile")
      .attr("data-chromosome", (d) => d.source_id)
      .attr("data-reference-chromosome", (d) => d.block_id)
      .attr("data-locus", (d) => d.source_start + ":" + d.source_end)
      .attr("data-reference-locus", (d) => d.start + ":" + d.end)
      .attr("data-orientation", (d) => d.orientation)
      .attr("data-organism", (d) => d && this.data.genusSpecies[d.id]);
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

  /** Handles events that come from the GCV eventBus.
   * @param {GCVevent} event - A GCV event containing a type and targets attributes.
   */
  protected eventHandler(event) {
    // select the relevant elements in the viewer
    let selection;
    if (event.targets.hasOwnProperty("block")) {
      const block = event.targets.block;
                       // block
      const selector = "[data-chromosome='" + block.source.chromosome + "']" +
                       "[data-reference-chromosome='" + block.reference.chromosome + "']" +
                       "[data-locus='" + block.source.locus.join(":") + "']" +
                       "[data-reference-locus='" + block.reference.locus.join(":") + "']" +
                       "[data-orientation='" + block.orientation + "']" +
                       ", " +
                       // corresponding block
                       "[data-reference-chromosome='" + block.source.chromosome + "']" +
                       "[data-chromosome='" + block.reference.chromosome + "']" +
                       "[data-reference-locus='" + block.source.locus.join(":") + "']" +
                       "[data-locus='" + block.reference.locus.join(":") + "']" +
                       "[data-orientation='" + block.orientation + "']" +
                       ", " +
                       // chord
                       ".chord" +
                       "[data-chromosome='" + block.source.chromosome + "']" +
                       "[data-reference-chromosome='" + block.reference.chromosome + "']" +
                       "[data-locus='" + block.source.locus.join(":") + "']" +
                       "[data-reference-locus='" + block.reference.locus.join(":") + "']";
      selection = this.circos.svg.selectAll(selector);
    } else if (event.targets.hasOwnProperty("chromosome")) {
      const selector = "[data-chromosome='" + event.targets.chromosome + "'], " +
                       "[data-reference-chromosome='" + event.targets.chromosome + "']";
      selection = this.circos.svg.selectAll(selector);
    } else if (event.targets.hasOwnProperty("organism")) {
      const selector = "[data-organism='" + event.targets.organism + "']";
      selection = this.circos.svg.selectAll(selector);
    }
    // (un)fade the (un)selected elements
    switch(event.type) {
      case "select":
        this.circos.svg.classed("hovering", true);
        if (selection !== undefined) {
          selection.classed("active", true);
        }
        break;
      case "deselect":
        if (selection !== undefined) {
          selection.classed("active", false);
        }
        this.circos.svg.classed("hovering", false);
        break;
    }
  }

  destroy() {
    if (this.eventBus !== undefined) {
      this.eventBus.unsubscribe();
    }
    // TODO: remove only elements added by Circos
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
    this.circos = undefined;
  }

  /** Generates the raw SVG xml. */
  xml() {
    try {
      const isFileSaverSupported = !!new Blob();
    } catch (e) {
      alert("Your broswer does not support saving");
    }
    // create a clone of the viewer with all GCV styles inlined
    const clone = this.inlineCopy();
    // generate the data
    const xml = (new XMLSerializer()).serializeToString(clone.node());
    return xml;
  }

  /** Makes a copy of the SVG and inlines external GCV styles. */
  protected inlineCopy(mod = (clone) => {/* noop */}) {
    // clone the current view node
    const clone = d3.select(this.circos.svg.node().cloneNode(true));
    mod(clone);
    // load the external styles
    const sheets: any = document.styleSheets;
    // inline GCV styles
    for (const sheet of sheets) {
      let rules: any;
      try {
        rules = sheet.rules || sheet.cssRules;
      } catch {
        continue;
      }
      for (const r of Object.keys(rules)) {
        const rule = rules[r];
        const selector = rule.selectorText;
        if (selector !== undefined && selector.startsWith(".GCV")) {
          const style = rule.style;
          const selection = clone.selectAll(selector);
          for (const prop of style) {
            selection.style(prop, style[prop]);
          }
        }
      }
    }
    return clone;
  }
}
