// Angular + dependencies
import { AfterViewInit, Component, ElementRef, ViewChild,
  ViewEncapsulation } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { GCV } from "../../../assets/js/gcv";

// App
import * as Split from "split.js";
import { Family } from "../../models/family.model";
import { Gene } from "../../models/gene.model";
import { Group } from "../../models/group.model";
import { MicroTracks } from "../../models/micro-tracks.model";
import { microTracksSelector } from "../../selectors/micro-tracks.selector";
import { AlignmentService } from "../../services/alignment.service";
import { FilterService } from "../../services/filter.service";
import { UrlService } from "../../services/url.service";

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
  @ViewChild("topRight") topRight: ElementRef;
  @ViewChild("bottomRight") bottomRight: ElementRef;

  // UI

  // what to show in left slider
  selectedDetail = null;

  // micro viewer accordion
  accordionTypes = {REGEXP:0, ORDER:1};
  accordion = null;

  // data
  queryGenes: string[];
  microTracks: MicroTracks;
  microLegend: any;

  // viewers
  microColors = GCV.common.colors;
  microArgs: any;
  microLegendArgs: any;

  // constructor

  constructor(private alignmentService: AlignmentService,
              private filterService: FilterService,
              private urlService: UrlService) {
    // subscribe to multi query genes
    this.urlService.multiQueryGenes
      .subscribe((genes) => {
        this.queryGenes = genes;
        this.hideLeftSlider();
      });
  }

  // Angular hooks

  ngAfterViewInit(): void {
    Split([this.left.nativeElement, this.right.nativeElement], {
        direction: "horizontal"
      });
    Split([this.topLeft.nativeElement, this.bottomLeft.nativeElement], {
        direction: "vertical"
      });
    Split([this.topRight.nativeElement, this.bottomRight.nativeElement], {
        direction: "vertical"
      });
    // don"t subscribe to data until view loaded so drawing doesn"t fail
    Observable
      .combineLatest(
        this.alignmentService.alignedMicroTracks,
        this.filterService.regexp,
        this.filterService.order,
      )
      .let(microTracksSelector())
      .subscribe((tracks) => {
        this._onMicroTracks(tracks);
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

  selectParams(): void {
    this.selectedDetail = {};
  }

  selectGene(gene: Gene): void {
    const g = Object.assign(Object.create(Gene.prototype), gene);
    this.selectedDetail = g;
  }

  selectFamily(family: Family): void {
    const f = Object.assign(Object.create(Family.prototype), family);
    this.selectedDetail = f;
  }

  selectTrack(track: Group): void {
    const t = Object.assign(Object.create(Group.prototype), track);
    this.selectedDetail = t;
  }

  // private

  private _onMicroTracks(tracks): void {
    if (tracks.groups.length > 0 && tracks.groups[0].genes.length > 0) {
      // compute how many genes each family has
      const familySizes = (tracks.groups.length > 1)
                        ? GCV.common.getFamilySizeMap(tracks)
                        : undefined;

      // micro viewer arguments
      this.microArgs = {
        autoResize: true,
        geneClick: function(g, track) {
          this.selectGene(g);
        }.bind(this),
        highlight: this.queryGenes,
        nameClick: function(t) {
          this.selectTrack(t);
        }.bind(this),
        selectiveColoring: familySizes,
      };

      // micro legend arguments
      const highlight = tracks.groups.reduce((l, group) => {
        const families = group.genes
          .filter((g) => this.queryGenes.indexOf(g.name) !== -1)
          .map((g) => g.family);
        return l.concat(families);
      }, []);
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
      const d = ",";
      const singletonIds = ["singleton"].concat(uniqueFamilies.filter((f) => {
        return familySizes === undefined || familySizes[f.id] === 1;
      }).map((f) => f.id)).join(d);
      this.microLegendArgs = {
        autoResize: true,
        blank: {name: "Singletons", id: singletonIds},
        blankDashed: {name: "Orphans", id: ""},
        highlight,
        keyClick: function(f) {
          this.selectFamily(f);
        }.bind(this),
        multiDelimiter: d,
        selectiveColoring: familySizes,
        selector: "family",
      };

      // micro legend data
      const presentFamilies = tracks.groups.reduce((l, group) => {
        return l.concat(group.genes.map((g) => g.family));
      }, []);
      this.microLegend = uniqueFamilies.filter((f) => {
        return presentFamilies.indexOf(f.id) !== -1 && f.name !== "";
      });

      // micro track data
      this.microTracks = tracks;
    }
  }
}
