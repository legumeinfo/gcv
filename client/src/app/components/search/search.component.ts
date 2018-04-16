// Angular
import { AfterViewInit, Component, ComponentFactory, ComponentFactoryResolver,
  ComponentRef, ElementRef, OnDestroy, OnInit, QueryList, ViewContainerRef,
  ViewChild, ViewChildren, ViewEncapsulation } from "@angular/core";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
// app
import * as Split from "split.js";
import { GCV } from "../../../assets/js/gcv";
import { AppConfig } from "../../app.config";
import { Alert } from "../../models/alert.model";
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
import { PlotsService } from "../../services/plots.service";
import { AlertComponent } from "../shared/alert.component";
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
export class SearchComponent implements AfterViewInit, OnDestroy, OnInit {
  // view children
  @ViewChild("left") left: ElementRef;
  @ViewChild("topLeft") topLeft: ElementRef;
  @ViewChild("bottomLeft") bottomLeft: ElementRef;
  @ViewChild("right") right: ElementRef;
  @ViewChild("topRight") topRight: ElementRef;
  @ViewChild("bottomRight") bottomRight: ElementRef;
  @ViewChild("macroAlerts", {read: ViewContainerRef}) macroAlerts: ViewContainerRef;
  @ViewChild("microAlerts", {read: ViewContainerRef}) microAlerts: ViewContainerRef;
  @ViewChild("plotAlerts", {read: ViewContainerRef}) plotAlerts: ViewContainerRef;
  @ViewChildren(PlotViewerComponent) plotComponents: QueryList<PlotViewerComponent>;

  headerAlert = new Alert("info", "Loading...");

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
  selectedLocalPlot: Group;
  selectedGlobalPlot: Group;

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

  // emits when the component is destroyed
  private destroy: Subject<boolean>;

  // TODO: update observable subscriptions so this and subscribeToMacro aren't needed
  private macroTrackObservable: Observable<[MacroTracks, any]>;  // Observable<[MacroTracks, MicroTracks]>;
  private macroSub: any;

  constructor(private alignmentService: AlignmentService,
              private config: AppConfig,
              private resolver: ComponentFactoryResolver,
              private filterService: FilterService,
              private macroTracksService: MacroTracksService,
              private microTracksService: MicroTracksService,
              private plotsService: PlotsService,
            ) {
    this.destroy = new Subject();
  }

  // Angular hooks

  ngAfterViewInit(): void {
    Split([this.left.nativeElement, this.right.nativeElement], {
        direction: "horizontal",
        minSize: 0,
      });
    Split([this.topLeft.nativeElement, this.bottomLeft.nativeElement], {
        direction: "vertical",
        minSize: 0,
      });
    Split([this.topRight.nativeElement, this.bottomRight.nativeElement], {
        direction: "vertical",
        minSize: 0,
      });
  }

  ngOnDestroy(): void {
    this.destroy.next(true);
    this.destroy.complete();
  }

  ngOnInit(): void {
    this._initUIState();

    // subscribe to HTTP requests
    this.macroTracksService.requests
      .takeUntil(this.destroy)
      .subscribe(([args, request]) => {
        if (args.requestType === "chromosome") {
          this._requestToAlertComponent(args.serverID, request, "chromosome", this.macroAlerts);
        } else if (args.requestType === "macro") {
          this._requestToAlertComponent(args.serverID, request, "tracks", this.macroAlerts);
        }
      });
    this.microTracksService.requests
      .takeUntil(this.destroy)
      .subscribe(([args, request]) => {
        if (args.requestType === "microQuery") {
          this._requestToAlertComponent(args.serverID, request, "query track", this.microAlerts);
        } else if (args.requestType === "microSearch") {
          this._requestToAlertComponent(args.serverID, request, "tracks", this.microAlerts);
        }
      });
    this.plotsService.requests
      .takeUntil(this.destroy)
      .subscribe(([args, request]) => {
        this._requestToAlertComponent(args.serverID, request, "plot", this.plotAlerts);
      });

    // subscribe to micro track data
    const filteredMicroTracks = Observable
      .combineLatest(
        this.alignmentService.alignedMicroTracks,
        this.filterService.regexpAlgorithm,
        this.filterService.orderAlgorithm,
      )
      .let(microTracksSelector({skipFirst: true}));

    filteredMicroTracks
      .withLatestFrom(
        this.microTracksService.routeParams,
        this.microTracksService.microTracks
          .map((tracks) => tracks.groups.length),
      )
      .takeUntil(this.destroy)
      .subscribe(([tracks, route, numReturned]) => {
        this._onAlignedMicroTracks(tracks as MicroTracks, route, numReturned);
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
      .takeUntil(this.destroy)
      .subscribe(([tracks, route]) => this._onMacroTracks(tracks));

    // subscribe to micro-plots changes
    Observable
      .combineLatest(this.plotsService.localPlots, filteredMicroTracks)
      .takeUntil(this.destroy)
      .let(plotsSelector())
      .subscribe((plots) => this.microPlots = plots);
    this.plotsService.selectedLocalPlot
      .filter((plot) => plot !== null)
      .takeUntil(this.destroy)
      .subscribe((plot) => {
        this.selectedLocalPlot = plot;
      });
    this.plotsService.selectedGlobalPlot
      .filter((plot) => plot !== null)
      .takeUntil(this.destroy)
      .subscribe((plot) => {
        this.selectedGlobalPlot = plot;
      });
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

  selectPlot(track: Group): void {
    this.showLocalGlobalPlots = true;
    const id = track.id;
    if (this.selectedPlot === this.plotTypes.LOCAL) {
      this.plotsService.selectLocal(id);
    } else if (this.selectedPlot === this.plotTypes.GLOBAL) {
      this.plotsService.selectGlobal(id);
    }
  }

  showGlobalPlot(): void {
    this.plotsService.selectedLocalPlotID.take(1).subscribe((id) => {
      this.plotsService.selectGlobal(id);
    });
    this.selectedPlot = this.plotTypes.GLOBAL;
  }

  showLocalPlot(): void {
    this.plotsService.selectedGlobalPlotID.take(1).subscribe((id) => {
      this.plotsService.selectLocal(id);
    });
    this.selectedPlot = this.plotTypes.LOCAL;
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
    // TODO: this uses specific knowledge about the origins of gene objects, instead,
    // create a util function that returns all objects in prototype chain and spead
    // into assign
    const g = Object.assign(Object.create(Gene.prototype), Object.getPrototypeOf(gene));
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

  private _getHeaderAlert(tracks: MicroTracks, numTracks: number): Alert {
    let message = numTracks + " track" + ((numTracks !== 1) ? "s" : "") + " returned; ";
    const numAligned = tracks.groups.length - 1;
    message += numAligned + " track" + ((numAligned !== 1) ? "s" : "") + " aligned";
    let type: string;
    if (numTracks === 0) {
      type = "danger";
    } else if (numTracks === numAligned) {
      type = "success";
    } else if (numAligned === 0) {
      type = "warning";
    } else {
      type = "info";
    }
    return new Alert(type, message);
  }

  private _requestToAlertComponent(serverID, request, what, container) {
    const source = this.config.getServer(serverID).name;
    const factory: ComponentFactory<AlertComponent> = this.resolver.resolveComponentFactory(AlertComponent);
    const componentRef: ComponentRef<AlertComponent> = container.createComponent(factory);
    // EVIL: Angular doesn't have a defined method for hooking dynamic components into
    // the Angular lifecycle so we must explicitly call ngOnChanges whenever a change
    // occurs. Even worse, there is no hook for the Output directive, so we must
    // shoehorn the desired functionality in!
    componentRef.instance.close = function(componentRef) {
      componentRef.destroy();
    }.bind(this, componentRef);
    componentRef.instance.float = true;
    componentRef.instance.alert = new Alert(
      "info",
      "Loading " + what + " from \"" + source + "\"",
      {spinner: true},
    );
    componentRef.instance.ngOnChanges({});
    request
      .takeUntil(componentRef.instance.onClose)
      .subscribe(
        (response) => {
          componentRef.instance.alert = new Alert(
            "success",
            "Successfully loaded " + what + " from \"" + source + "\"",
            {closable: true, autoClose: 3},
          );
          componentRef.instance.ngOnChanges({});
        },
        (error) => {
          componentRef.instance.alert = new Alert(
            "danger",
            "Failed to load " + what + " from \"" + source + "\"",
            {closable: true},
          );
          componentRef.instance.ngOnChanges({});
        });
  }

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
    //this.showLocalPlot();
    this.selectedPlot = this.plotTypes.LOCAL;
    this.hideLocalGlobalPlots();
  }

  private _onAlignedMicroTracks(tracks: MicroTracks, route, numReturned): void {
    this.hideLocalGlobalPlots();
    if (tracks.groups.length > 0 && tracks.groups[0].genes.length > 0) {
      // update alert
      this.headerAlert = this._getHeaderAlert(tracks, numReturned);

      // compute how many genes each family has
      const familySizes = (tracks.groups.length > 1)
                      ? GCV.common.getFamilySizeMap(tracks.groups)
                      : undefined;

      // find the focus gene
      const query = tracks.groups[0];
      const i = query.genes.map((g) => g.name).indexOf(route.gene);
      const focus = query.genes[i];

      // macro viewer arguments
      this.macroLegendArgs = this._getMacroLegendArgs(
        [focus !== undefined ? query.genus + " " + query.species : undefined]
      );

      // dot plot arguments
      this.plotArgs = this._getPlotArgs(familySizes);

      // micro viewer arguments
      this.microArgs = this._getMicroArgs(route.gene, familySizes);

      // macro viewer arguments
      const queryGenes = query.genes;
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

  private _viewportDrag(d1, d2): void {
    const position = parseInt((d1 + d2) / 2, 10);
    this.macroTracksService.nearestGene(position);
  }
}
