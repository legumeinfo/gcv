// Angular + dependencies
import { Router } from '@angular/router';
import { AfterViewInit,
         Component,
         ElementRef,
         OnInit,
         QueryList,
         ViewChild,
         ViewChildren,
         ViewEncapsulation }      from '@angular/core';
import { Observable }             from 'rxjs/Observable';
import * as Split                 from 'split.js';
import { GCV }                    from '../../../assets/js/gcv';

// App
import { AlignmentService }          from '../../services/alignment.service';
import { AppConfig }                 from '../../app.config';
import { Family }                    from '../../models/family.model';
import { FilterService }             from '../../services/filter.service';
import { Gene }                      from '../../models/gene.model';
import { Group }                     from '../../models/group.model';
import { MacroTracks }               from '../../models/macro-tracks.model';
import { macroTracksSelector }       from '../../selectors/macro-tracks.selector';
import { MacroTracksService }        from '../../services/macro-tracks.service';
import { MicroTracks }               from '../../models/micro-tracks.model';
import { microTracksSelector }       from '../../selectors/micro-tracks.selector';
import { PlotViewerComponent }       from '../viewers/plot.component';
import { plotsSelector }             from '../../selectors/plots.selector';
import { PlotsService }              from '../../services/plots.service';
import { UrlService }          from '../../services/url.service';

declare var RegExp: any;  // TypeScript doesn't support regexp as argument...
declare var parseInt: any;  // TypeScript doesn't recognize number inputs

enum ContentTypes {
  VIEWERS,
  PLOTS
}

enum PlotTypes {
  LOCAL,
  GLOBAL
}

enum AccordionTypes {
  REGEXP,
  ORDER,
  SCROLL,
  SEARCH
}

@Component({
  moduleId: module.id.toString(),
  selector: 'search',
  templateUrl: 'search.component.html',
  styleUrls: [ 'search.component.css', '../../../assets/css/split.css' ],
  encapsulation: ViewEncapsulation.None
})

export class SearchComponent implements AfterViewInit, OnInit {
  // view children

  // EVIL: ElementRefs nested in switch cases are undefined when parent or child
  // AfterViewInit hooks are called, so routines that depend on them are called
  // via their setters.
  private _splitSizes = {
    left: 70,
    right: 30,
    topLeft: 50,
    bottomLeft: 50,
    topRight: 50,
    bottomRight: 50
  };
  private _left: ElementRef;
  @ViewChild('left')
  set left(el: ElementRef) {
    this._left = el;
    this._splitViewers();
  }
  private _topLeft: ElementRef;
  @ViewChild('topLeft')
  set topLeft(el: ElementRef) {
    this._topLeft = el;
    this._splitViewers();
  }
  private _bottomLeft: ElementRef;
  @ViewChild('bottomLeft')
  set bottomLeft(el: ElementRef) {
    this._bottomLeft = el;
    this._splitViewers();
  }
  private _right: ElementRef;
  @ViewChild('right')
  set right(el: ElementRef) {
    this._right = el;
    this._splitViewers();
  }
  private _topRight: ElementRef;
  @ViewChild('topRight')
  set topRight(el: ElementRef) {
    this._topRight = el;
    this._splitViewers();
  }
  private _bottomRight: ElementRef;
  @ViewChild('bottomRight')
  set bottomRight(el: ElementRef) {
    this._bottomRight = el;
    this._splitViewers();
  }

  @ViewChildren(PlotViewerComponent) plotComponents: QueryList<PlotViewerComponent>;

  // UI

  // show viewers or dot plots
  contentTypes = ContentTypes;
  selectedContent;

  // show dot plots and local or global
  plotTypes = PlotTypes;
  showLocalGlobalPlots: boolean;
  selectedPlot;

  // what to show in left slider
  selectedDetail;

  // micro synteny accordion
  accordionTypes = AccordionTypes;
  accordion = this.accordionTypes.SCROLL;

  macroConfig = {
    order: true,
    filter: false
  }
  private _macroSplit: any;

  // data
  private _querySource: string;
  private _queryGene: string;

  // dot plots
  microPlots: any;//MicroTracks;
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
  private _macroTracks: Observable<[MacroTracks, any]>;//Observable<[MacroTracks, MicroTracks]>;
  private _macroSub: any;
  macroLegend: any;
  macroTracks: MacroTracks;
  macroArgs: any;
  macroLegendArgs: any;
  plotArgs: any;

  // constructor

  constructor(private _alignmentService: AlignmentService,
              private _config: AppConfig,
              private _filterService: FilterService,
              private _macroTracksService: MacroTracksService,
              private _plotsService: PlotsService,
              private _router: Router,
              private _urlService: UrlService) {
    // subscribe to search query gene
    this._urlService.searchQueryGene
      .filter(searchQuery => searchQuery !== undefined)
      .subscribe(searchQuery => {
        this._querySource = searchQuery.source;
        this._queryGene   = searchQuery.gene;
        this.hideLeftSlider();
      });
  }

  // Angular hooks

  private _initUI(): void {
    this.showViewers();
    this.showLocalPlot();
    this.hideLocalGlobalPlots();
  }


  private _onAlignedMicroTracks(tracks): void {
    if (tracks.groups.length > 0 && tracks.groups[0].genes.length > 0) {
      // compute how many genes each family has
      let familySizes = (tracks.groups.length > 1)
                      ? GCV.common.getFamilySizeMap(tracks)
                      : undefined;

      // macro viewer arguments
      let i = tracks.groups[0].genes.map(g => g.name).indexOf(this._queryGene);
      let focus = tracks.groups[0].genes[i];
      this.macroLegendArgs = {
        autoResize: true,
        highlight: [focus != undefined ? focus.family : undefined],
        selector: 'genus-species'
      };

      // dot plot arguments
      this.plotArgs = {
        autoResize: true,
        geneClick: function (g, track) {
          this.selectGene(g);
        }.bind(this),
        outlier: -1,
        plotClick: function (p) {
          this.selectPlot(p);
        }.bind(this),
        selectiveColoring: familySizes
        }

      // micro viewer arguments
      this.microArgs = {
        autoResize: true,
        boldFirst: true,
        geneClick: function (g, track) {
          this.selectGene(g);
        }.bind(this),
        highlight: [this._queryGene],
        plotClick: function (p) {
          this.selectPlot(p);
        }.bind(this),
        nameClick: function (t) {
          this.selectTrack(t);
        }.bind(this),
        selectiveColoring: familySizes
      };

      // macro viewer arguments
      this.queryGenes = tracks.groups[0].genes;
      let s = this._config.getServer(tracks.groups[0].source);
      if (s !== undefined && s.hasOwnProperty('macroColors')) {
        this.macroColors = s['macroColors'].function;
        this._macroSplit.setSizes([
          this._splitSizes.topRight,
          this._splitSizes.bottomRight
        ]);
      } else {
        this.macroColors = undefined;
        this._macroSplit.collapse(0);
      }
      this.macroArgs = {
        autoResize: true,
        viewport: {
          start: this.queryGenes[0].fmin,
          stop: this.queryGenes[this.queryGenes.length - 1].fmax
        },
        viewportDrag: function (d1, d2) {
          this._viewportDrag(d1, d2);
        }.bind(this),
        highlight: tracks.groups.map(t => t.chromosome_name),
        colors: this.macroColors
      };

      var orderedUniqueFamilyIds = new Set();
      tracks.groups.forEach(group => {
        group.genes.forEach(gene => {
          orderedUniqueFamilyIds.add(gene.family);
        });
      });
      var familyMap = {};
      tracks.families.forEach(f => {
        familyMap[f.id] = f;
      });
      var uniqueFamilies = [];
      orderedUniqueFamilyIds.forEach(id => {
        if (familyMap[id] !== undefined) uniqueFamilies.push(familyMap[id]);
      });

      // micro legend arguments
      var d = ",";
      var singletonIds = ["singleton"].concat(uniqueFamilies.filter(f => {
        return familySizes === undefined || familySizes[f.id] == 1;
      }).map(f => f.id)).join(d);
      this.microLegendArgs = {
        autoResize: true,
        keyClick: function (f) {
          this.selectFamily(f);
        }.bind(this),
        highlight: [focus != undefined ? focus.family : undefined],
        selectiveColoring: familySizes,
        selector: 'family',
        blank: {name: "Singletons", id: singletonIds},
        blankDashed: {name: "Orphans", id: ""},
        multiDelimiter: d
      };
      var presentFamilies = tracks.groups.reduce((l, group) => {
        return l.concat(group.genes.map(g => g.family));
      }, []);
      this.microLegend = uniqueFamilies.filter(f => {
        return presentFamilies.indexOf(f.id) != -1 && f.name != '';
      });

      // micro track data
      this.microTracks = tracks;
    }
  }

  private _onPlotSelection(plot): void {
    this.selectedLocal = this.selectedGlobal = undefined;
    if (this.selectedPlot == this.plotTypes.GLOBAL) this.showGlobalPlot();
    else this.showLocalPlot();
  }

  private _onMacroTracks(tracks): void {
    this.macroTracks = tracks;
    if (tracks !== undefined) {
      let seen = {};
      this.macroLegend = tracks.tracks.reduce((l, t) => {
        let name = t.genus + ' ' + t.species;
        if (!seen[name]) {
          seen[name] = true;
          l.push({name: name, id: name});
        } return l;
      }, [])
    }
  }

  private _subscribeToMacro(): void {
    if (this._macroSub !== undefined)
      this._macroSub.unsubscribe();
    this._macroSub = this._macroTracks
      .let(macroTracksSelector(this.macroConfig.filter, this.macroConfig.order))
      .subscribe(this._onMacroTracks.bind(this));
  }

  ngOnInit(): void {
    this._initUI();
  }

  ngAfterViewInit(): void {
    // don't subscribe to data until view loaded so drawing doesn't fail

    // subscribe to aligned micro tracks
    let microTracks = Observable
      .combineLatest(
        this._alignmentService.alignedMicroTracks,
        this._filterService.regexp,
        this._filterService.order)
      .let(microTracksSelector({skipFirst: true}));
    microTracks
      .subscribe(tracks => this._onAlignedMicroTracks(tracks));

    // subscribe to micro-plots changes
    Observable
      .combineLatest(this._plotsService.localPlots, microTracks)
      .let(plotsSelector())
      .subscribe(plots => this.microPlots = plots);
    this._plotsService.selectedPlot
      .subscribe(this._onPlotSelection.bind(this));

    // subscribe to macro-track changes
    this._macroTracksService.macroTracks
      .subscribe(tracks => this.macroTracks = tracks);
    this._macroTracks = Observable
      .combineLatest(this._macroTracksService.macroTracks, microTracks)
    this._subscribeToMacro();
  }

  // private

  private _splitViewers(): void {
    if (this._left !== undefined
    &&  this._topLeft !== undefined
    &&  this._bottomLeft !== undefined
    &&  this._right !== undefined
    &&  this._topRight !== undefined
    &&  this._bottomRight !== undefined) {
      let parseWidth = (el): number => {
        let regexp = new RegExp(/calc\(|\%(.*)/, 'g');
        return parseFloat(el.style.width.replace(regexp, ''));
      }
      let parseHeight = (el): number => {
        let regexp = new RegExp(/calc\(|\%(.*)/, 'g');
        return parseFloat(el.style.height.replace(regexp, ''));
      }
      let leftEl        = this._left.nativeElement,
          topLeftEl     = this._topLeft.nativeElement,
          bottomLeftEl  = this._bottomLeft.nativeElement,
          rightEl       = this._right.nativeElement,
          topRightEl    = this._topRight.nativeElement,
          bottomRightEl = this._bottomRight.nativeElement;
      Split([leftEl, rightEl], {
        sizes: [this._splitSizes.left, this._splitSizes.right],
        gutterSize: 8,
        cursor: 'col-resize',
        minSize: 0,
        onDragEnd: () => {
          this._splitSizes.left  = parseWidth(leftEl);
          this._splitSizes.right = parseWidth(rightEl);
        }
      })
      Split([topLeftEl, bottomLeftEl], {
        sizes: [this._splitSizes.topLeft, this._splitSizes.bottomLeft],
        direction: 'vertical',
        gutterSize: 8,
        cursor: 'row-resize',
        minSize: 0,
        onDragEnd: () => {
          this._splitSizes.topLeft    = parseHeight(topLeftEl);
          this._splitSizes.bottomLeft = parseHeight(bottomLeftEl);
        }
      })
      this._macroSplit = Split([topRightEl, bottomRightEl], {
        sizes: [this._splitSizes.topRight, this._splitSizes.bottomRight],
        direction: 'vertical',
        gutterSize: 8,
        cursor: 'row-resize',
        minSize: 0,
        onDragEnd: () => {
          this._splitSizes.topRight    = parseHeight(topRightEl);
          this._splitSizes.bottomRight = parseHeight(bottomRightEl);
        }
      })
    }
  }

  private _viewportDrag(d1, d2): void {
    let server = this._querySource;
    let chromosome = (this.microTracks.groups.length)
                   ? this.microTracks.groups[0].chromosome_id
                   : undefined;
    let position = parseInt((d1 + d2) / 2);
    if (server !== undefined && chromosome !== undefined) {
      let macroBack = this.macroTracks;
      this.macroTracks = undefined;
      this._macroTracksService.nearestGene(
        server,
        chromosome,
        position,
        function(tracks, g) {
          this.macroTracks = tracks;
          this._router.navigateByUrl('/search/' + server + '/' + g.name);
        }.bind(this, macroBack),
        function (tracks, m) {
          this.macroTracks = tracks;
        }.bind(this, macroBack)
      );
    }
  }

  // public

  // micro-synteny
  setAccordion(e: any, value: any): void {
    e.stopPropagation();
    this.accordion = (this.accordion == value) ? null : value;
  }

  // main content

  drawPlots(): void {
    this.plotComponents.forEach(p => {
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
    this._plotsService.selectPlot(plot);
  }

  showGlobalPlot(): void {
    this.selectedPlot = this.plotTypes.GLOBAL;
    this._plotsService.getSelectedGlobal(plot => this.selectedGlobal = plot);
  }

  showLocalPlot(): void {
    this.selectedPlot  = this.plotTypes.LOCAL;
    this.selectedLocal = this._plotsService.getSelectedLocal();
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
    let g = Object.assign(Object.create(Gene.prototype), gene);
    this.selectedDetail = g;
  }

  selectFamily(family: Family): void {
    let f = Object.assign(Object.create(Family.prototype), family);
    this.selectedDetail = f;
  }

  selectTrack(track: Group): void {
    let t = Object.assign(Object.create(Group.prototype), track);
    this.selectedDetail = t;
  }
}
