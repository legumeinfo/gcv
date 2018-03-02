// Angular + dependencies
import { AfterViewInit, Component, ElementRef, ViewChild,
  ViewEncapsulation } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { GCV } from "../../../assets/js/gcv";
// app
import * as Split from "split.js";
import { AppConfig } from "../../app.config";
import { Family } from "../../models/family.model";
import { Gene } from "../../models/gene.model";
import { Group } from "../../models/group.model";
import { MacroTracks } from "../../models/macro-tracks.model";
import { MicroTracks } from "../../models/micro-tracks.model";
import { microTracksSelector } from "../../selectors/micro-tracks.selector";
import { AlignmentService } from "../../services/alignment.service";
import { FilterService } from "../../services/filter.service";
import { MacroTracksService } from "../../services/macro-tracks.service";
import { MicroTracksService } from "../../services/micro-tracks.service";

@Component({
  encapsulation: ViewEncapsulation.None,
  moduleId: module.id.toString(),
  selector: "multi",
  styles: [ require("./multi.component.scss"),
            require("../../../assets/css/split.scss") ],
  template: require("./multi.component.html"),
})
export class MultiComponent implements AfterViewInit {
  // view children
  @ViewChild("left") left: ElementRef;
  @ViewChild("topLeft") topLeft: ElementRef;
  @ViewChild("bottomLeft") bottomLeft: ElementRef;
  @ViewChild("right") right: ElementRef;
  //@ViewChild("topRight") topRight: ElementRef;
  @ViewChild("bottomRight") bottomRight: ElementRef;

  // what to show in left slider
  selectedDetail = null;

  // micro synteny accordion
  readonly accordionTypes = {REGEXP: 0, ORDER: 1};
  accordion = null;

  // micro viewers
  microArgs: any;
  microColors = GCV.common.colors;
  microLegend: any;
  microLegendArgs: any;
  microTracks: MicroTracks;
  //queryGenes: string[];

  // marco viewers
  macroArgs: any;
  macroTracks: MacroTracks[];

  constructor(private alignmentService: AlignmentService,
              private config: AppConfig,
              private filterService: FilterService,
              private macroTracksService: MacroTracksService,
              private microTracksService: MicroTracksService) { }

  // Angular hooks

  ngAfterViewInit(): void {
    Split([this.left.nativeElement, this.right.nativeElement], {
        direction: "horizontal",
      });
    Split([this.topLeft.nativeElement, this.bottomLeft.nativeElement], {
        direction: "vertical",
      });
    //Split([this.topRight.nativeElement, this.bottomRight.nativeElement], {
    //    direction: "vertical",
    //  });

    // subscribe to micro track data
    Observable
      .combineLatest(
        this.alignmentService.alignedMicroTracks,
        this.filterService.regexpAlgorithm,
        this.filterService.orderAlgorithm,
      )
      .let(microTracksSelector({prefix: (t) => "group " + t.cluster + " - "}))
      .withLatestFrom(this.microTracksService.routeParams)
      .filter(([tracks, route]) => route.genes !== undefined)
      .subscribe(([tracks, route]) => {
        this._onAlignedMicroTracks(tracks as MicroTracks, route);
      });

    // subscribe to macro track data
    this.macroTracksService.multiMacroTracks
      .filter((tracks) => tracks !== undefined)
      .subscribe((tracks) => {
        this.macroTracks = tracks;
      });
  }

  // public

  // micro-synteny
  setAccordion(e: any, value: any): void {
    e.stopPropagation();
    this.accordion = (this.accordion === value) ? null : value;
  }

  // left slider
  // EVIL: typescript checks types at compile time so we have to explicitly
  // instantiate those that will be checked by left-slider at run-time

  hideLeftSlider(): void {
    this.selectedDetail = null;
  }

  selectFamily(family: Family): void {
    const f = Object.assign(Object.create(Family.prototype), family);
    this.selectedDetail = f;
  }

  selectGene(gene: Gene): void {
    const g = Object.assign(Object.create(Gene.prototype), gene);
    this.selectedDetail = g;
  }

  selectParams(): void {
    this.selectedDetail = {};
  }

  selectTrack(track: Group): void {
    const t = Object.assign(Object.create(Group.prototype), track);
    this.selectedDetail = t;
  }

  // private

  private _onAlignedMicroTracks(tracks: MicroTracks, route): void {
    if (tracks.groups.length > 0 && tracks.groups[0].genes.length > 0) {
      // compute how many genes each family has
      const familySizes = (tracks.groups.length > 1)
                        ? GCV.common.getFamilySizeMap(tracks.groups)
                        : undefined;

      // micro viewer arguments
      this.microArgs = this._getMicroArgs(route.genes, familySizes);

      // macro viewer
      // TODO: provide a color function for each source - federation!
      const s: any = this.config.getServer(tracks.groups[0].source);
      let macroColors: any;
      if (s !== undefined && s.macroColors !== undefined) {
        macroColors = s.macroColors.function;
      }
      this.macroArgs = this._getMacroArgs(
        macroColors,
        tracks.groups.map((t) => {
          return {
            chromosome: t.chromosome_name,
            start: Math.min(...t.genes.map((g) => g.fmin)),
            stop: Math.max(...t.genes.map((g) => g.fmax)),
          };
        }),
      );

      // make sure families are unique and ordered by appearance in tracks
      // TODO: move uniqueness to reducer and ordering to selector
      const orderedUniqueFamilyIds = new Set();
      tracks.groups.forEach((group) => {
        group.genes.forEach((gene) => {
          orderedUniqueFamilyIds.add(gene.family);
        });
      });
      const familyMap = {};
      tracks.families.forEach((f) => {
        familyMap[f.id] = f;
      });
      const uniqueFamilies = [];
      orderedUniqueFamilyIds.forEach((id) => {
        if (familyMap[id] !== undefined) {
          uniqueFamilies.push(familyMap[id]);
        }
      });
      const singletonIds = ["singleton"].concat(uniqueFamilies.filter((f) => {
        return familySizes === undefined || familySizes[f.id] === 1;
      }).map((f) => f.id)).join(",");

      // micro legend arguments
      const highlight = tracks.groups.reduce((l, group) => {
        const families = group.genes
          .filter((g) => route.genes.indexOf(g.name) !== -1)
          .map((g) => g.family);
        return l.concat(families);
      }, []);
      this.microLegendArgs = this._getMicroLegendArgs(singletonIds, highlight, familySizes);

      // micro legend data
      const presentFamilies = tracks.groups.reduce((l, group) => {
        return l.concat(group.genes.map((g) => g.family));
      }, []);
      this.microLegend = uniqueFamilies.filter((f) => {
        return presentFamilies.indexOf(f.id) !== -1 && f.name !== "";
      });

      // update micro track data
      this.microTracks = tracks;
    }
  }

  private _getMacroArgs(
    colors: any,
    highlight: {chromosome: string, start: number, stop: number}[]
  ): any {
    return {
      colors,
      highlight,
    };
  }

  private _getMicroArgs(focusNames: string[], familySizes: any): any {
    return {
      autoResize: true,
      geneClick: function(g, track) {
        this.selectGene(g);
      }.bind(this),
      highlight: focusNames,
      nameClick: function(t) {
        this.selectTrack(t);
      }.bind(this),
      selectiveColoring: familySizes,
      prefix: (t) => "group " + t.cluster + " - ",
    };
  }

  private _getMicroLegendArgs(singletonIds: any, highlight: string[], familySizes: any): any {
    return {
      autoResize: true,
      blank: {name: "Singletons", id: singletonIds},
      blankDashed: {name: "Orphans", id: ""},
      highlight,
      keyClick: function(f) {
        this.selectFamily(f);
      }.bind(this),
      multiDelimiter: ",",
      selectiveColoring: familySizes,
      selector: "family",
    };
  }
}
