// Angular + dependencies
import { AfterViewInit, Component, ComponentFactory, ComponentFactoryResolver,
  ComponentRef, ElementRef, NgZone, OnDestroy, OnInit, ViewChild,
  ViewContainerRef, ViewEncapsulation } from "@angular/core";
import { BehaviorSubject, Observable, Subject, combineLatest } from "rxjs";
import { filter, map, scan, takeUntil, withLatestFrom } from "rxjs/operators";
import { GCV } from "../../../assets/js/gcv";
// app
import Split from "split.js";
import tippy from "tippy.js";
import { AppConfig } from "../../app.config";
import { Alert, Family, Gene, Group, MacroTracks, MicroTracks } from "../../models";
import { ClusterMixin, DrawableMixin, PointMixin } from "../../models/mixins";
import { microTracksOperator, multiMacroTracksOperator } from "../../operators";
import { AlignmentService, FilterService, InterAppCommunicationService,
  MacroTracksService, MicroTracksService } from "../../services";
import { AlertComponent } from "../shared/alert.component";

declare var $: any;

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: "multi",
  styleUrls: [ "./multi.component.scss",
               "../../../assets/css/split.scss" ],
  templateUrl: "./multi.component.html",
})
export class MultiComponent implements AfterViewInit, OnDestroy, OnInit {
  // view children
  @ViewChild("left", {static: true}) left: ElementRef;
  @ViewChild("topLeft", {static: true}) topLeft: ElementRef;
  @ViewChild("bottomLeft", {static: true}) bottomLeft: ElementRef;
  @ViewChild("right", {static: true}) right: ElementRef;
  @ViewChild("topRight", {static: true}) topRight: ElementRef;
  @ViewChild("bottomRight", {static: true}) bottomRight: ElementRef;
  @ViewChild("macroAlerts", {static: true, read: ViewContainerRef}) macroAlerts: ViewContainerRef;
  @ViewChild("microAlerts", {static: true, read: ViewContainerRef}) microAlerts: ViewContainerRef;

  headerAlert = new Alert("info", "Loading...");

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
  familyGlyphs: Observable<{[key: string]: string}>;

  // marco viewers
  macroArgs: any;
  macroColors: any;
  macroLegend: any;
  macroLegendArgs = {
    autoResize: true,
    selector: "organism",
    sizeCallback: this._setSplitWidth.bind(this, 1),
  };
  macroTracks: MacroTracks[];

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

  constructor(private alignmentService: AlignmentService,
              private resolver: ComponentFactoryResolver,
              private filterService: FilterService,
              private communicationService: InterAppCommunicationService,
              private macroTracksService: MacroTracksService,
              private microTracksService: MicroTracksService,
              private zone: NgZone) {
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
    // subscribe to HTTP requests
    this.macroTracksService.requests
      .pipe(takeUntil(this.destroy))
      .subscribe(([args, request]) => {
        if (args.requestType === "chromosome") {
          const what = "\"" + args.body.chromosome + "\"";
          this._requestToAlertComponent(args.serverID, request, what, this.macroAlerts);
        } else if (args.requestType === "macro") {
          const targets = args.body.targets;
          const what = "tracks for \"" + targets[targets.length - 1] + "\"";
          this._requestToAlertComponent(args.serverID, request, what, this.macroAlerts);
        }
      });
    this.microTracksService.requests
      .pipe(takeUntil(this.destroy))
      .subscribe(([args, request]) => {
        if (args.requestType === "microMulti") {
          this._requestToAlertComponent(args.serverID, request, "tracks", this.microAlerts);
        }
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

    const glyphedAlignedTracks: Observable<MicroTracks<DrawableMixin, ClusterMixin, DrawableMixin & PointMixin>> = combineLatest(
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

    this.alignmentService.alignedMicroTracks
      .pipe(takeUntil(this.destroy))
      .subscribe((tracks) => {
        this.hideLeftSlider();
        this._setFamilyGlyph(null, null);
      });

    glyphedAlignedTracks
      .pipe(
        withLatestFrom(this.microTracksService.routeParams),
        takeUntil(this.destroy))
      .subscribe(([tracks, route]) => {
        this._onAlignedMicroTracks(tracks, route);
      });

    const filteredMicroTracks =
      combineLatest(
        glyphedAlignedTracks,
        this.filterService.regexpAlgorithm,
        this.filterService.orderAlgorithm)
      .pipe(microTracksOperator({prefix: (t) => "group " + t.cluster + " - "}));

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
        this.macroTracksService.multiMacroTracks
          .pipe(filter((tracks) => tracks !== undefined)),
        filteredMicroTracks)
      .pipe(multiMacroTracksOperator())
      .pipe(takeUntil(this.destroy))
      .subscribe((tracks) => {
        this._onMacroTracks(tracks);
      });
  }

  // public

  // micro-synteny
  setAccordion(e: any, value: any): void {
    e.stopPropagation();
    this.accordion = (this.accordion === value) ? null : value;
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

  private _onAlignedMicroTracks(tracks: MicroTracks<DrawableMixin, ClusterMixin>, route): void {
    if (tracks.groups.length > 0 && tracks.groups[0].genes.length > 0) {
      // update alert
      this.headerAlert = this._getHeaderAlert(tracks);

      // compute how many genes each family has
      const familySizes = (tracks.groups.length > 1)
                        ? GCV.common.getFamilySizeMap(tracks.groups)
                        : undefined;

      // micro viewer arguments
      this.microArgs = this._getMicroArgs(route.genes, familySizes);

      // macro viewer
      // TODO: provide a color function for each source - federation!
      const s: any = AppConfig.getServer(tracks.groups[0].source);
      if (s !== undefined && s.macroColors !== undefined) {
        this.macroColors = s.macroColors.function;
      } else {
        this.macroColors = undefined;
      }
      this.macroArgs = this._getMacroArgs(
        this.macroColors,
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

      // micro legend data
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
      const highlight = tracks.groups.reduce((l, group) => {
        const families = group.genes
          .filter((g) => route.genes.indexOf(g.name) !== -1)
          .map((g) => g.family);
        return l.concat(families);
      }, []);
      this.microLegendArgs = this._getMicroLegendArgs(singleton, orphan, highlight, familySizes);
    }
  }

  private _onMacroTracks(tracks: MacroTracks[]): void {
    if (tracks !== undefined) {
      const seen = {};
      this.macroLegend = tracks.reduce((l, t) => {
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

  private _getHeaderAlert(tracks: MicroTracks<DrawableMixin, ClusterMixin>): Alert {
    let message = "";
    const numTracks = tracks.groups.length;
    message += numTracks + " track" + ((numTracks !== 1) ? "s" : "") + " returned; ";
    const clustered = tracks.groups.reduce((clustered, group) => {
      if (group.cluster !== undefined) {
        clustered.push(group.cluster);
      };
      return clustered;
    }, []);
    const numClustered = clustered.length;
    message += numClustered + " tracks clustered into ";
    const numClusters = (new Set(clustered)).size;
    message += numClusters + " group" + ((numClusters !== 1) ? "s" : "");
    let type: string;
    if (numTracks === 0) {
      type = "danger";
    } else if (numTracks === numClustered) {
      type = "success";
    } else if (numClustered === 0) {
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

  private _getMacroArgs(
    colors: any,
    highlight: {chromosome: string, start: number, stop: number}[]
  ): any {
    return {
      autoResize: true,
      colors,
      highlight,
      replicateBlocks: true,
    };
  }

  private _getMicroArgs(focusNames: string[], familySizes: any): any {
    return {
      autoResize: true,
      geneClick: function(g, track) {
        this.selectDetail(g);
      }.bind(this),
      highlight: focusNames,
      nameClick: function(t) {
        this.selectDetail(t);
      }.bind(this),
      selectiveColoring: familySizes,
      prefix: (t) => "group " + t.cluster + " - ",
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
        const glyph = (checked ? null : "circle");
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
}
