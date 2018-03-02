// Angular
import { AfterViewInit, Component, ElementRef, OnInit, QueryList, ViewChild,
  ViewChildren, ViewEncapsulation } from "@angular/core";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { Observable } from "rxjs/Observable";
// app
import * as Split from "split.js";
import { GCV } from "../../../assets/js/gcv";
import { AppConfig } from "../../app.config";
import { Family } from "../../models/family.model";
import { Gene } from "../../models/gene.model";
import { Group } from "../../models/group.model";
import { MacroTracks } from "../../models/macro-tracks.model";
import { MicroTracks } from "../../models/micro-tracks.model";
import { macroTracksSelector } from "../../selectors/macro-tracks.selector";
import { microTracksSelector } from "../../selectors/micro-tracks.selector";
import { plotsSelector } from "../../selectors/plots.selector";
import { AlignmentService } from "../../services/alignment.service";
import { FilterService } from "../../services/filter.service";
import { MacroTracksService } from "../../services/macro-tracks.service";
import { MicroTracksService } from "../../services/micro-tracks.service";
//import { PlotsService } from "../../services/plots.service";
import { PlotViewerComponent } from "../viewers/plot.component";

declare let RegExp: any;  // TypeScript doesn't support regexp arguments
declare let parseInt: any;  // TypeScript doesn't recognize number inputs

@Component({
  encapsulation: ViewEncapsulation.None,
  moduleId: module.id.toString(),
  selector: "search",
  styles: [ require("./search.component.scss"),
            require("../../../assets/css/split.scss") ],
  template: require("./search.component.html"),
})
export class SearchComponent implements AfterViewInit, OnInit {
  // view children
  @ViewChild("left") left: ElementRef;
  @ViewChild("topLeft") topLeft: ElementRef;
  @ViewChild("bottomLeft") bottomLeft: ElementRef;
  @ViewChild("right") right: ElementRef;
  @ViewChild("topRight") topRight: ElementRef;
  @ViewChild("bottomRight") bottomRight: ElementRef;
  @ViewChildren(PlotViewerComponent) plotComponents: QueryList<PlotViewerComponent>;

  // show viewers or dot plots
  readonly contentTypes = {PLOTS: 0, VIEWERS: 1};
  selectedContent;

  // show dot plots and local or global
  readonly plotTypes = {LOCAL: 0, GLOBAL: 1};
  showLocalGlobalPlots: boolean;
  selectedPlot;

  // what to show in left slider
  selectedDetail = null;

  // micro synteny accordion
  readonly accordionTypes = {REGEXP: 0, ORDER: 1, SCROLL: 2, SEARCH: 3};
  accordion = this.accordionTypes.SCROLL;

  macroConfig = {
    filter: false,
    order: true,
  };
  macroConfigObservable = new BehaviorSubject(this.macroConfig);;

  // dot plots
  microPlots: any;  // MicroTracks;
  plotArgs: any;
  selectedLocal: Group;
  selectedGlobal: Group;

  // micro viewers
  microArgs: any;
  microColors = GCV.common.colors;
  microLegend: any;
  microLegendArgs: any;
  microTracks: MicroTracks;
  //queryGenes: Gene[];

  // macro viewers
  macroArgs: any;
  macroColors: any;
  macroLegend: any;
  macroLegendArgs: any;
  macroTracks: MacroTracks;

  // TODO: update observable subscriptions so this and subscribeToMacro aren't needed
  private macroTrackObservable: Observable<[MacroTracks, any]>;  // Observable<[MacroTracks, MicroTracks]>;
  private macroSub: any;

  constructor(private alignmentService: AlignmentService,
              private config: AppConfig,
              private filterService: FilterService,
              private macroTracksService: MacroTracksService,
              private microTracksService: MicroTracksService,
              //private plotsService: PlotsService,
            ) { }

  // Angular hooks

  ngAfterViewInit(): void {
    Split([this.left.nativeElement, this.right.nativeElement], {
        direction: "horizontal",
      });
    Split([this.topLeft.nativeElement, this.bottomLeft.nativeElement], {
        direction: "vertical",
      });
    Split([this.topRight.nativeElement, this.bottomRight.nativeElement], {
        direction: "vertical",
      });
  }

  ngOnInit(): void {
    this._initUIState();

    // subscribe to micro track data
    const filteredMicroTracks = Observable
      .combineLatest(
        this.alignmentService.alignedMicroTracks,
        this.filterService.regexpAlgorithm,
        this.filterService.orderAlgorithm,
      )
      .let(microTracksSelector({skipFirst: true}));

    filteredMicroTracks
      .withLatestFrom(this.microTracksService.routeParams)
      .filter(([tracks, route]) => route.gene !== undefined)
      .subscribe(([tracks, route]) => {
        this._onAlignedMicroTracks(tracks as MicroTracks, route);
      });

    // subscribe to macro track data
    Observable
      .combineLatest(
        this.macroTracksService.macroTracks,
        filteredMicroTracks,
        this.macroConfigObservable,
      )
      .let(macroTracksSelector())
      .withLatestFrom(this.microTracksService.routeParams)
      .filter(([tracks, route]) => route.gene !== undefined)
      .subscribe(([tracks, route]) => this._onMacroTracks(tracks));

    // subscribe to micro-plots changes
    //Observable
    //  .combineLatest(this.plotsService.localPlots, microTracks)
    //  .let(plotsSelector())
    //  .subscribe((plots) => this.microPlots = plots);
    //this.plotsService.selectedPlot
    //  .subscribe(this._onPlotSelection.bind(this));
  }

  // public

  // micro-synteny
  setAccordion(e: any, value: any): void {
    e.stopPropagation();
    this.accordion = (this.accordion === value) ? null : value;
  }

  // main content

  drawPlots(): void {
    this.plotComponents.forEach((p) => {
      p.draw();
    });
  }

  // macro-viewer

  toggleMacroOrder(): void {
    this.macroConfig.order = !this.macroConfig.order;
    this.macroConfigObservable.next(this.macroConfig);
  }

  toggleMacroFilter(): void {
    this.macroConfig.filter = !this.macroConfig.filter;
    this.macroConfigObservable.next(this.macroConfig);
  }

  showPlots(): void {
    this.selectedContent = this.contentTypes.PLOTS;
  }

  showViewers(): void {
    this.selectedContent = this.contentTypes.VIEWERS;
  }

  // local/global plots

  hideLocalGlobalPlots(): void {
    this.showLocalGlobalPlots = false;
  }

  selectPlot(plot: Group): void {
    this.showLocalGlobalPlots = true;
    //this.plotsService.selectPlot(plot);
  }

  showGlobalPlot(): void {
    this.selectedPlot = this.plotTypes.GLOBAL;
    //this.plotsService.getSelectedGlobal((plot) => this.selectedGlobal = plot);
  }

  showLocalPlot(): void {
    this.selectedPlot  = this.plotTypes.LOCAL;
    //this.selectedLocal = this.plotsService.getSelectedLocal();
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

  private _getMacroArgs(colors: any, highlight: string[], viewport: any): any {
    return {
      autoResize: true,
      colors,
      highlight,
      viewportDrag: function(d1, d2) {
        this._viewportDrag(d1, d2);
      }.bind(this),
      viewport,
    };
  }

  private _getMacroLegendArgs(highlight: string[]): any {
    return {
      autoResize: true,
      highlight,
      selector: "genus-species",
    };
  }

  private _getMicroArgs(focusName: string, familySizes: any): any {
    return {
      autoResize: true,
      boldFirst: true,
      geneClick: function (g, track) {
        this.selectGene(g);
      }.bind(this),
      highlight: [focusName],
      plotClick: function (p) {
        this.selectPlot(p);
      }.bind(this),
      nameClick: function (t) {
        this.selectTrack(t);
      }.bind(this),
      selectiveColoring: familySizes
    };
  }

  private _getMicroLegendArgs(singletonIds: string, highlight: string[], familySizes: any): any {
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

  private _getPlotArgs(familySizes: any): any {
    return {
      autoResize: true,
      geneClick: function(g, track) {
        this.selectGene(g);
      }.bind(this),
      outlier: -1,
      plotClick: function(p) {
        this.selectPlot(p);
      }.bind(this),
      selectiveColoring: familySizes,
    };
  }

  private _initUIState(): void {
    this.showViewers();
    this.showLocalPlot();
    this.hideLocalGlobalPlots();
  }

  private _onAlignedMicroTracks(tracks: MicroTracks, route): void {
    if (tracks.groups.length > 0 && tracks.groups[0].genes.length > 0) {
      // compute how many genes each family has
      const familySizes = (tracks.groups.length > 1)
                      ? GCV.common.getFamilySizeMap(tracks.groups)
                      : undefined;

      // find the focus gene
      const i = tracks.groups[0].genes.map((g) => g.name).indexOf(route.gene);
      const focus = tracks.groups[0].genes[i];

      // macro viewer arguments
      this.macroLegendArgs = this._getMacroLegendArgs(
        [focus !== undefined ? focus.family : undefined]
      );

      // dot plot arguments
      this.plotArgs = this._getPlotArgs(familySizes);

      // micro viewer arguments
      this.microArgs = this._getMicroArgs(route.gene, familySizes);

      // macro viewer arguments
      const queryGenes = tracks.groups[0].genes;
      // TODO: update for federated coloring - each source has its own coloring
      const s: any = this.config.getServer(tracks.groups[0].source);
      if (s !== undefined && s.macroColors !== undefined) {
        this.macroColors = s.macroColors.function;
      } else {
        this.macroColors = undefined;
      }
      this.macroArgs = this._getMacroArgs(
        this.macroColors,
        tracks.groups.map((t) => t.chromosome_name),
        {
          start: queryGenes[0].fmin,
          stop: queryGenes[queryGenes.length - 1].fmax,
        },
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
      const highlight = [focus !== undefined ? focus.family : undefined];
      this.microLegendArgs = this._getMicroLegendArgs(singletonIds, highlight, familySizes);

      // generate micro legend data
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

  private _onMacroTracks(tracks): void {
    if (tracks !== undefined) {
      const seen = {};
      this.macroLegend = tracks.tracks.reduce((l, t) => {
        const name = t.genus + " " + t.species;
        if (!seen[name]) {
          seen[name] = true;
          l.push({name, id: name});
        }
        return l;
      }, []);
      this.macroTracks = tracks;
    }
  }

  private _onPlotSelection(plot): void {
    this.selectedLocal = this.selectedGlobal = undefined;
    if (this.selectedPlot === this.plotTypes.GLOBAL) {
      this.showGlobalPlot();
    } else {
      this.showLocalPlot();
    }
  }

  private _viewportDrag(d1, d2): void {
    const position = parseInt((d1 + d2) / 2, 10);
    //this.macroTracksService.nearestGene(position);
  }
}
