// Angular
import { AfterViewInit, Component, ComponentFactory, ComponentFactoryResolver,
  ComponentRef, ElementRef, NgZone, OnDestroy, OnInit, QueryList,
  ViewContainerRef, ViewChild, ViewChildren, ViewEncapsulation } from "@angular/core";
import { BehaviorSubject, Observable, Subject, combineLatest } from "rxjs";
import { filter, map, scan, take, takeUntil, withLatestFrom } from "rxjs/operators";
// app
import Split from "split.js";
import tippy from "tippy.js";
import { GCV } from "../../../assets/js/gcv";
import { AppConfig } from "../../app.config";
import { Alert, Family, Gene, Group, MacroTracks, MicroTracks } from "../../models";
import { DrawableMixin } from "../../models/mixins";
import { macroTracksOperator, microTracksOperator, plotsOperator } from "../../operators";
import { AlignmentService, FilterService, InterAppCommunicationService,
  MacroTracksService, MicroTracksService, PlotsService } from "../../services";
import { AlertComponent } from "../shared/alert.component";
import { PlotViewerComponent } from "../viewers/plot.component";

declare var $: any;

declare let RegExp: any;  // TypeScript doesn't support regexp arguments
declare let parseInt: any;  // TypeScript doesn't recognize number inputs

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: "search",
  styleUrls: [ "./search.component.scss",
               "../../../assets/css/split.scss" ],
  templateUrl: "./search.component.html",
})
export class SearchComponent implements AfterViewInit, OnDestroy, OnInit {
  // view children
  @ViewChild("left", {static: true}) left: ElementRef;
  @ViewChild("topLeft", {static: true}) topLeft: ElementRef;
  @ViewChild("bottomLeft", {static: true}) bottomLeft: ElementRef;
  @ViewChild("right", {static: true}) right: ElementRef;
  @ViewChild("topRight", {static: true}) topRight: ElementRef;
  @ViewChild("bottomRight", {static: true}) bottomRight: ElementRef;
  @ViewChild("macroAlerts", {static: true, read: ViewContainerRef}) macroAlerts: ViewContainerRef;
  @ViewChild("microAlerts", {static: true, read: ViewContainerRef}) microAlerts: ViewContainerRef;
  @ViewChild("plotAlerts", {static: true, read: ViewContainerRef}) plotAlerts: ViewContainerRef;
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
  familyGlyphs: Observable<{[key: string]: string}>;

  // macro viewers
  macroArgs: any;
  macroColors: any;
  macroLegend: any;
  macroLegendArgs: any;
  macroTracks: MacroTracks;

  // inter-app communication
  communicate: boolean = AppConfig.COMMUNICATION.channel !== undefined;
  private eventBus;

  // store the vertical Split for resizing
  private verticalSplit: any;
  private legendWidths = [0, 0];  // [micro, macro]

  // emits when the component is destroyed
  private destroy: Subject<boolean>;

  // track which families have been checked
  private familyGlyphsSubject = new BehaviorSubject<{[key: string]: string}>({});

  // TODO: update observable subscriptions so this and subscribeToMacro aren't needed
  private macroTrackObservable: Observable<[MacroTracks, any]>;  // Observable<[MacroTracks, MicroTracks]>;
  private macroSub: any;

  constructor(private alignmentService: AlignmentService,
              private resolver: ComponentFactoryResolver,
              private filterService: FilterService,
              private communicationService: InterAppCommunicationService,
              private macroTracksService: MacroTracksService,
              private microTracksService: MicroTracksService,
              private zone: NgZone,
              private plotsService: PlotsService) {
    this.destroy = new Subject();
    // hook the GCV eventbus into a Broadcast Channel
    if (this.communicate) {
      this._setupCommunication();
    }
  }

  // Angular hooks

  ngAfterViewInit(): void {
    // initialize Split.js
    this.verticalSplit = Split([this.left.nativeElement, this.right.nativeElement], {
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
    // enable tooltips
    tippy("[data-tippy-content]", {animation: "fade", arrow: true, boundary: "viewport"});
  }

  ngOnDestroy(): void {
    if (this.communicate) {
      this.eventBus.unsubscribe();
    }
    this.destroy.next(true);
    this.destroy.complete();
  }

  ngOnInit(): void {
    this._initUIState();

    // subscribe to HTTP requests
    this.macroTracksService.requests
      .pipe(takeUntil(this.destroy))
      .subscribe(([args, request]) => {
        if (args.requestType === "chromosome") {
          this._requestToAlertComponent(args.serverID, request, "chromosome", this.macroAlerts);
        } else if (args.requestType === "macro") {
          this._requestToAlertComponent(args.serverID, request, "tracks", this.macroAlerts);
        }
      });
    this.microTracksService.requests
      .pipe(takeUntil(this.destroy))
      .subscribe(([args, request]) => {
        if (args.requestType === "microQuery") {
          this._requestToAlertComponent(args.serverID, request, "query track", this.microAlerts);
        } else if (args.requestType === "microSearch") {
          this._requestToAlertComponent(args.serverID, request, "tracks", this.microAlerts);
        } else if (args.requestType === "spanToSearch") {
          this._requestToAlertComponent(args.serverID, request, "span", this.microAlerts);
        }
      });
    this.plotsService.requests
      .pipe(takeUntil(this.destroy))
      .subscribe(([args, request]) => {
        this._requestToAlertComponent(args.serverID, request, "plot", this.plotAlerts);
      });

    // subscribe to micro track data

    this.familyGlyphs = this.familyGlyphsSubject.asObservable()
      .pipe(
        scan((glyphs, {family, glyph}) => {
          if (family === null && glyph === null) {
            return {};
          } else if (glyph === null) {
            delete glyphs[family];
          } else {
            glyphs[family] = glyph;
          }
          return glyphs;
        }),
        takeUntil(this.destroy));

    const glyphedAlignedTracks = combineLatest(
        this.alignmentService.alignedMicroTracks,
        this.familyGlyphs)
      .pipe(
        map(([tracks, glyphs]) => {
          return {
            // ensure the orphan family is present
            families: [...tracks.families, {id: "", name: ""}].map((f) => {
              if (glyphs.hasOwnProperty(f.id)) {
                const family = Object.create(f);
                family.glyph = glyphs[f.id];
                return family;
              }
              return f;
            }),
            groups: tracks.groups.map((t) => {
              const track = Object.create(t);
              track.genes = t.genes.map((g) => {
                if (glyphs.hasOwnProperty(g.family)) {
                  const gene = Object.create(g);
                  gene.glyph = glyphs[g.family];
                  return gene;
                }
                return g;
              });
              return track;
            }),
          };
        }));

    this.microTracksService.microTracks
      .pipe(takeUntil(this.destroy))
      .subscribe((tracks) => {
        this.hideLeftSlider();
        this._setFamilyGlyph(null, null);
      });

    glyphedAlignedTracks
      .pipe(
        withLatestFrom(
          this.microTracksService.routeParams,
          this.microTracksService.microTracks
            .pipe(map((tracks) => tracks.groups.length))),
        takeUntil(this.destroy))
      .subscribe(([tracks, route, numReturned]) => {
        this._onAlignedMicroTracks(tracks as MicroTracks, route, numReturned);
      });

    const filteredMicroTracks =
      combineLatest(
        glyphedAlignedTracks,
        this.filterService.regexpAlgorithm,
        this.filterService.orderAlgorithm)
      .pipe(microTracksOperator({skipFirst: true}));

    filteredMicroTracks
      .pipe(takeUntil(this.destroy))
      .subscribe((tracks) => {
        // add gene tooltips
        tracks.groups.forEach((group) => {
          group.genes = group.genes.map((gene) => {
            const g = Object.create(gene);
            g.htmlAttributes = {
              "data-tippy-content": function (g) {
                return `
                  <div class="media" style="text-align:left;">
                    <div class="media-body">
                      <h6 class="mt-0 mb-1"><b>${g.name}</b> (${g.family})</h6>
                      ${g.fmin} - ${g.fmax}
                    </div>
                  </div>
                `;
              }
            };
            return g;
          });
        });
        this.microTracks = tracks as MicroTracks;
      });

    // subscribe to macro track data
      combineLatest(
        this.macroTracksService.macroTracks,
        filteredMicroTracks,
        this.macroConfigObservable)
      .pipe(macroTracksOperator())
      .pipe(
        withLatestFrom(this.microTracksService.routeParams),
        filter(([tracks, route]) => route.gene !== undefined),
        takeUntil(this.destroy))
      .subscribe(([tracks, route]) => this._onMacroTracks(tracks));

    // subscribe to micro-plots changes
    combineLatest(this.plotsService.localPlots, filteredMicroTracks)
      .pipe(takeUntil(this.destroy))
      .pipe(plotsOperator())
      .subscribe((plots) => this.microPlots = plots);
    this.plotsService.selectedLocalPlot
      .pipe(
        filter((plot) => plot !== null),
        takeUntil(this.destroy))
      .subscribe((plot) => {
        this.selectedLocalPlot = plot;
      });
    this.plotsService.selectedGlobalPlot
      .pipe(
        filter((plot) => plot !== null),
        takeUntil(this.destroy))
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
    this.plotsService.selectedLocalPlotID
      .pipe(take(1))
      .subscribe((id) => {
        this.plotsService.selectGlobal(id);
      });
    this.selectedPlot = this.plotTypes.GLOBAL;
  }

  showLocalPlot(): void {
    this.plotsService.selectedGlobalPlotID
      .pipe(take(1))
      .subscribe((id) => {
        this.plotsService.selectLocal(id);
      });
    this.selectedPlot = this.plotTypes.LOCAL;
  }

  // left slider

  hideLeftSlider(): void {
    this.selectedDetail = null;
  }

  selectDetail(detail: {} | Family | Gene | Group = {}): void {
    this.selectedDetail = detail;
  }

  // private

  private _setupCommunication(): void {
    this.communicationService.messages
      .pipe(takeUntil(this.destroy))
      .subscribe((message) => {
        // perform an extent search if extent not in micro-synteny
        if (message.data.targets.hasOwnProperty("chromosome") &&
            message.data.targets.hasOwnProperty("extent")) {
          const c = message.data.targets.chromosome;
          const [low, high] = message.data.targets.extent;
          const i = this.microTracks.groups.map((g) => g.chromosome_name).indexOf(c);
          if (i !== -1) {
            const genes = this.microTracks.groups[i].genes.filter((g) => {
              return g.fmin >= low && g.fmin <= high ||
                     g.fmax >= low && g.fmax <= high;
            });
            if (genes.length === 0) {
              this.zone.run(() => {
                this.microTracksService.spanSearch(c, low, high);
              });
            }
          } else {
            this.zone.run(() => {
              this.microTracksService.spanSearch(c, low, high);
            });
          }
        }
        // propogate the message
        message.data.flag = true;
        GCV.common.eventBus.publish(message.data);
      });
    this.eventBus = GCV.common.eventBus.subscribe((event) => {
      if (!event.flag) {
        this.communicationService.postMessage(event, this.microTracks);
      }
    });
  }

  private _setFamilyGlyph(family: string, glyph: string): void {
    this.familyGlyphsSubject.next({family, glyph});
  }

  private _setSplitWidth(legend: number, size: any): void {
    if (this.verticalSplit !== undefined) {
      this.legendWidths[legend] = size.width;
      const width = Math.max(...this.legendWidths);
      const totalWidth = this.left.nativeElement.offsetWidth +
                         this.right.nativeElement.offsetWidth;
      const rightWidth = ((width + 50) / totalWidth) * 100;
      const leftWidth = 100 - rightWidth;
      this.verticalSplit.setSizes([leftWidth, rightWidth]);
    }
  }

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
    const source = AppConfig.getServer(serverID).name;
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
      .pipe(takeUntil(componentRef.instance.onClose))
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
      selector: "organism",
      sizeCallback: this._setSplitWidth.bind(this, 1),
    };
  }

  private _getMicroArgs(focusName: string, familySizes: any): any {
    return {
      autoResize: true,
      boldFirst: true,
      geneClick: function (g, track) {
        this.selectDetail(g);
      }.bind(this),
      highlight: [focusName],
      plotClick: function (p) {
        this.selectPlot(p);
      }.bind(this),
      nameClick: function (t) {
        this.selectDetail(t);
      }.bind(this),
      selectiveColoring: familySizes,
      onInit: function () {
        tippy(
          ".GCV [data-tippy-content]",
          {
            animation: "fade",
            appendTo: document.body,
            arrow: true,
            boundary: "viewport",
            theme: "light-border",
            interactive: true,
            maxWidth: null,
            delay: [500, 20],
          }
        );
      }
    };
  }

  private _getMicroLegendArgs(singleton: Family, orphan: Family, highlight: string[], familySizes: any): any {
    return {
      autoResize: true,
      blank: singleton,
      blankDashed: orphan,
      checkboxes: [""],
      checkboxCallback: function(f, checked) {
        const glyph = (checked ?  null : "circle");
        this._setFamilyGlyph(f, glyph);
      }.bind(this),
      highlight,
      keyClick: function(f) {
        this.selectDetail(f);
      }.bind(this),
      multiDelimiter: ",",
      selectiveColoring: familySizes,
      selector: "family",
      sizeCallback: this._setSplitWidth.bind(this, 0),
    };
  }

  private _getPlotArgs(familySizes: any): any {
    return {
      autoResize: true,
      geneClick: function(g, track) {
        this.selectDetail(g);
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
      const s: any = AppConfig.getServer(tracks.groups[0].source);
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
      const orderedUniqueFamilyIds = new Set<string>();
      tracks.groups.forEach((group) => {
        group.genes.forEach((gene) => {
          orderedUniqueFamilyIds.add(gene.family);
        });
      });
      const familyMap: any = {};
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
      const singleton: Family = {name: "Singletons", id: singletonIds};

      // generate micro legend data
      const presentFamilies = tracks.groups.reduce((l, group) => {
        return l.concat(group.genes.map((g) => g.family));
      }, []);
      this.microLegend = uniqueFamilies.filter((f) => {
        return presentFamilies.indexOf(f.id) !== -1 && f.name !== "";
      });
      const orphan: Family & DrawableMixin = {name: "Orphans", id: ""};
      if (familyMap.hasOwnProperty("") && familyMap[""].glyph !== undefined) {
        orphan.glyph = familyMap[""].glyph;
        orphan.checked = false;
      }

      // micro legend arguments
      const highlight = [focus !== undefined ? focus.family : undefined];
      this.microLegendArgs = this._getMicroLegendArgs(singleton, orphan, highlight, familySizes);
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
