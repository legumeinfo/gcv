// Angular + dependencies
import { AfterViewInit, Component, ElementRef, OnInit, QueryList, ViewChild,
  ViewChildren, ViewEncapsulation } from "@angular/core";
import { Router } from "@angular/router";
import { Observable } from "rxjs/Observable";

// App
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
import { PlotsService } from "../../services/plots.service";
import { UrlService } from "../../services/url.service";
import { PlotViewerComponent } from "../viewers/plot.component";

declare let RegExp: any;  // TypeScript doesn"t support regexp as argument...
declare let parseInt: any;  // TypeScript doesn"t recognize number inputs

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

  // UI

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

  // dot plots
  microPlots: any;  // MicroTracks;
  selectedLocal: Group;
  selectedGlobal: Group;

  // viewers
  microTracks: MicroTracks;
  microLegend: any;
  queryGenes: Gene[];
  microColors = GCV.common.colors;
  macroColors: any;
  microArgs: any;
  microLegendArgs: any;
  macroLegend: any;
  macroTracks: MacroTracks;
  macroArgs: any;
  macroLegendArgs: any;
  plotArgs: any;

  private macroSplit: any;

  // data
  private querySource: string;
  private queryGene: string;

  private macroTrackObservable: Observable<[MacroTracks, any]>;  // Observable<[MacroTracks, MicroTracks]>;
  private macroSub: any;

  // constructor

  constructor(private alignmentService: AlignmentService,
              private config: AppConfig,
              private filterService: FilterService,
              private macroTracksService: MacroTracksService,
              private plotsService: PlotsService,
              private router: Router,
              private urlService: UrlService) { }

  // Angular hooks

  ngOnInit(): void {
    this._initUI();
  }

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
    // don"t subscribe to data until view loaded so drawing doesn"t fail

    // subscribe to search query gene
    this.urlService.searchQueryGene
      .filter((searchQuery) => searchQuery !== undefined)
      .subscribe((searchQuery) => {
        this.querySource = searchQuery.source;
        this.queryGene   = searchQuery.gene;
        this.hideLeftSlider();
      });

  this.alignmentService.alignedMicroTracks
      .subscribe((tracks) => {
        this._onAlignedMicroTracks(tracks);
      })

    // subscribe to aligned micro tracks
    //const microTracks = Observable
    //  .combineLatest(
    //    this.alignmentService.alignedMicroTracks,
    //    this.filterService.regexp,
    //    this.filterService.order)
    //  .let(microTracksSelector({skipFirst: true}));
    //microTracks
    //  .subscribe((tracks) => this._onAlignedMicroTracks(tracks));

    // subscribe to micro-plots changes
    //Observable
    //  .combineLatest(this.plotsService.localPlots, microTracks)
    //  .let(plotsSelector())
    //  .subscribe((plots) => this.microPlots = plots);
    //this.plotsService.selectedPlot
    //  .subscribe(this._onPlotSelection.bind(this));

    // subscribe to macro-track changes
    //this.macroTracksService.macroTracks
    //  .subscribe((tracks) => this.macroTracks = tracks);
    //this.macroTrackObservable = Observable
    //  .combineLatest(this.macroTracksService.macroTracks, microTracks);
    //this._subscribeToMacro();
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
    this._subscribeToMacro();
  }

  toggleMacroFilter(): void {
    this.macroConfig.filter = !this.macroConfig.filter;
    this._subscribeToMacro();
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
    this.plotsService.selectPlot(plot);
  }

  showGlobalPlot(): void {
    this.selectedPlot = this.plotTypes.GLOBAL;
    this.plotsService.getSelectedGlobal((plot) => this.selectedGlobal = plot);
  }

  showLocalPlot(): void {
    this.selectedPlot  = this.plotTypes.LOCAL;
    this.selectedLocal = this.plotsService.getSelectedLocal();
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

  private _initUI(): void {
    this.showViewers();
    this.showLocalPlot();
    this.hideLocalGlobalPlots();
  }

  private _onAlignedMicroTracks(tracks): void {
    if (tracks.groups.length > 0 && tracks.groups[0].genes.length > 0) {
      // compute how many genes each family has
      const familySizes = (tracks.groups.length > 1)
                      ? GCV.common.getFamilySizeMap(tracks)
                      : undefined;

      // macro viewer arguments
      const i = tracks.groups[0].genes.map((g) => g.name).indexOf(this.queryGene);
      const focus = tracks.groups[0].genes[i];
      this.macroLegendArgs = {
        autoResize: true,
        highlight: [focus !== undefined ? focus.family : undefined],
        selector: "genus-species",
      };

      // dot plot arguments
      this.plotArgs = {
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

      // micro viewer arguments
      this.microArgs = {
        autoResize: true,
        boldFirst: true,
        geneClick: function(g, track) {
          this.selectGene(g);
        }.bind(this),
        highlight: [this.queryGene],
        nameClick: function(t) {
          this.selectTrack(t);
        }.bind(this),
        plotClick: function(p) {
          this.selectPlot(p);
        }.bind(this),
        selectiveColoring: familySizes,
      };

      // macro viewer arguments
      this.queryGenes = tracks.groups[0].genes;
      const s: any = this.config.getServer(tracks.groups[0].source);
      if (s !== undefined && s.macroColors !== undefined) {
        this.macroColors = s.macroColors.function;
        // this.macroSplit.setSizes([
        //   this._splitSizes.topRight,
        //   this._splitSizes.bottomRight
        // ]);
      } else {
        this.macroColors = undefined;
        this.macroSplit.collapse(0);
      }
      this.macroArgs = {
        autoResize: true,
        colors: this.macroColors,
        highlight: tracks.groups.map((t) => t.chromosome_name),
        viewport: {
          start: this.queryGenes[0].fmin,
          stop: this.queryGenes[this.queryGenes.length - 1].fmax,
        },
        viewportDrag: function(d1, d2) {
          this._viewportDrag(d1, d2);
        }.bind(this),
      };

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

      // micro legend arguments
      const d = ",";
      const singletonIds = ["singleton"].concat(uniqueFamilies.filter((f) => {
        return familySizes === undefined || familySizes[f.id] === 1;
      }).map((f) => f.id)).join(d);
      this.microLegendArgs = {
        autoResize: true,
        blank: {name: "Singletons", id: singletonIds},
        blankDashed: {name: "Orphans", id: ""},
        highlight: [focus !== undefined ? focus.family : undefined],
        keyClick: function(f) {
          this.selectFamily(f);
        }.bind(this),
        multiDelimiter: d,
        selectiveColoring: familySizes,
        selector: "family",
      };
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

  private _onPlotSelection(plot): void {
    this.selectedLocal = this.selectedGlobal = undefined;
    if (this.selectedPlot === this.plotTypes.GLOBAL) {
      this.showGlobalPlot();
    } else {
      this.showLocalPlot();
    }
  }

  private _onMacroTracks(tracks): void {
    this.macroTracks = tracks;
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
    }
  }

  private _subscribeToMacro(): void {
    if (this.macroSub !== undefined) {
      this.macroSub.unsubscribe();
    }
    this.macroSub = this.macroTrackObservable
      .let(macroTracksSelector(this.macroConfig.filter, this.macroConfig.order))
      .subscribe(this._onMacroTracks.bind(this));
  }

  private _viewportDrag(d1, d2): void {
    const position = parseInt((d1 + d2) / 2, 10);
    this.macroTracksService.nearestGene(position);
  }
}
