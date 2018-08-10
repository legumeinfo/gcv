// Angular + dependencies
import { AfterViewInit, Component, ComponentFactory, ComponentFactoryResolver,
  ComponentRef, ElementRef, OnDestroy, OnInit, ViewChild, ViewContainerRef,
  ViewEncapsulation } from "@angular/core";
import { Subject, combineLatest } from "rxjs";
import { filter, takeUntil, withLatestFrom } from "rxjs/operators";
import { GCV } from "../../../assets/js/gcv";
// app
import * as Split from "split.js";
import { AppConfig } from "../../app.config";
import { Alert, Family, Gene, Group, MacroTracks, MicroTracks } from "../../models";
import { microTracksOperator, multiMacroTracksOperator } from "../../operators";
import { AlignmentService, FilterService, MacroTracksService, MicroTracksService } from "../../services";
import { AlertComponent } from "../shared/alert.component";

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: "multi",
  styleUrls: [ "./multi.component.scss",
               "../../../assets/css/split.scss" ],
  templateUrl: "./multi.component.html",
})
export class MultiComponent implements AfterViewInit, OnDestroy, OnInit {
  // view children
  @ViewChild("left") left: ElementRef;
  @ViewChild("topLeft") topLeft: ElementRef;
  @ViewChild("bottomLeft") bottomLeft: ElementRef;
  @ViewChild("right") right: ElementRef;
  @ViewChild("topRight") topRight: ElementRef;
  @ViewChild("bottomRight") bottomRight: ElementRef;
  @ViewChild("macroAlerts", {read: ViewContainerRef}) macroAlerts: ViewContainerRef;
  @ViewChild("microAlerts", {read: ViewContainerRef}) microAlerts: ViewContainerRef;

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
  //queryGenes: string[];

  // marco viewers
  macroArgs: any;
  macroColors: any;
  macroLegend: any;
  macroLegendArgs = {
    autoResize: true,
    selector: "genus-species",
    sizeCallback: this._setSplitWidth.bind(this, 1),
  };
  macroTracks: MacroTracks[];

  // store the vertical Split for resizing
  private verticalSplit: any;
  private legendWidths = [0, 0];  // [micro, macro]

  // emits when the component is destroyed
  private destroy: Subject<boolean>;

  constructor(private alignmentService: AlignmentService,
              private resolver: ComponentFactoryResolver,
              private filterService: FilterService,
              private macroTracksService: MacroTracksService,
              private microTracksService: MicroTracksService) {
    this.destroy = new Subject();
  }

  // Angular hooks

  ngAfterViewInit(): void {
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
  }

  ngOnDestroy(): void {
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
    this.alignmentService.alignedMicroTracks
      .pipe(
        withLatestFrom(this.microTracksService.routeParams),
        takeUntil(this.destroy))
      .subscribe(([tracks, route]) => {
        this._onAlignedMicroTracks(tracks as MicroTracks, route);
      });

    const filteredMicroTracks =
      combineLatest(
        this.alignmentService.alignedMicroTracks,
        this.filterService.regexpAlgorithm,
        this.filterService.orderAlgorithm)
      .pipe(microTracksOperator({prefix: (t) => "group " + t.cluster + " - "}));

    filteredMicroTracks
      .pipe(takeUntil(this.destroy))
      .subscribe((tracks) => {
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

  private _onAlignedMicroTracks(tracks: MicroTracks, route): void {
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

  private _getHeaderAlert(tracks: MicroTracks): Alert {
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
      sizeCallback: this._setSplitWidth.bind(this, 0),
    };
  }
}
