// Angular
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject }        from 'rxjs/BehaviorSubject';
import { Component,
         ElementRef,
         OnInit,
         QueryList,
         ViewChild,
         ViewChildren,
         ViewEncapsulation }      from '@angular/core';
import { Observable }             from 'rxjs/Observable';

// App
import { Alert }               from '../../models/alert.model';
import { ALERT_SUCCESS,
         ALERT_INFO,
         ALERT_WARNING,
         ALERT_DANGER }        from '../../constants/alerts';
import { AlertsService }       from '../../services/alerts.service';
import { AlignmentService }    from '../../services/alignment.service';
import { Family }              from '../../models/family.model';
import { FilterService }       from '../../services/filter.service';
import { Gene }                from '../../models/gene.model';
import { Group }               from '../../models/group.model';
import { MacroTracks }         from '../../models/macro-tracks.model';
import { macroTracksSelector } from '../../selectors/macro-tracks.selector';
import { MacroTracksService }  from '../../services/macro-tracks.service';
import { MicroTracks }         from '../../models/micro-tracks.model';
import { microTracksSelector } from '../../selectors/micro-tracks.selector';
import { MicroTracksService }  from '../../services/micro-tracks.service';
import { PlotComponent }       from '../shared/plot.component';
import { plotsSelector }       from '../../selectors/plots.selector';
import { PlotsService }        from '../../services/plots.service';

declare var d3: any;
declare var contextColors: any;
declare var Split: any;
declare var getFamilySizeMap: any;
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

@Component({
  moduleId: module.id,
  selector: 'search',
  templateUrl: 'search.component.html',
  styleUrls: [ 'search.component.css' ],
  encapsulation: ViewEncapsulation.None
})

export class SearchComponent implements OnInit {
  // view children

  // EVIL: ElementRefs nested in switch cases are undefined when parent or child
  // AfterViewInit hooks are called, so routines that depend on them are called
  // via their setters.
  private _splitTop: ElementRef;
  private _splitTopSize = 50;
  @ViewChild('splitTop')
  set splitTop(el: ElementRef) {
    this._splitTop = el;
    this._splitViewers();
  }

  private _splitBottom: ElementRef;
  private _splitBottomSize = 50;
  @ViewChild('splitBottom')
  set splitBottom(el: ElementRef) {
    this._splitBottom = el;
    this._splitViewers();
  }

  @ViewChildren(PlotComponent) plotComponents: QueryList<PlotComponent>;

  // UI

  contentTypes = ContentTypes;
  selectedContent;

  plotTypes = PlotTypes;
  showLocalGlobalPlots: boolean;
  selectedPlot;

  selectedDetail;

  rightSliderHidden: boolean;

  private _showHelp = new BehaviorSubject<boolean>(true);
  showHelp = this._showHelp.asObservable();

  // data

  routeSource: string;
  routeGene: string;

  private _microTracks: Observable<MicroTracks>;
  microTracks: MicroTracks;
  queryGenes: Gene[];

  private _microPlots: Observable<MicroTracks>;
  microPlots: MicroTracks;

  private _macroTracks: Observable<MacroTracks>;
  macroTracks: MacroTracks;

  selectedLocal: Group;
  selectedGlobal: Group;

  private _numReturned: number;

  // viewers

  colors = contextColors;

  microArgs: any;
  legendArgs: any;
  macroArgs: any;

  plotArgs: any;

  // constructor

  constructor(private _route: ActivatedRoute,
              private _alerts: AlertsService,
              private _alignmentService: AlignmentService,
              private _filterService: FilterService,
              private _macroTracksService: MacroTracksService,
              private _microTracksService: MicroTracksService,
              private _plotsService: PlotsService,
              private _router: Router) { }

  // Angular hooks

  private _initUI(): void {
    this.showViewers();
    this.showLocalPlot();
    this.hideLocalGlobalPlots();
    this.hideRightSlider();
  }

  private _onParams(params): void {
    this.invalidate();
    this.hideLocalGlobalPlots();
    this.routeSource = params['source'];
    this.routeGene = params['gene'];
  }

  private _onRawMicroTracks(tracks): void {
    this._numReturned = tracks.groups.length - 1;  // exclude query
    this._macroTracksService.search(tracks);
  }


  private _onAlignedMicroTracks(tracks): void {
    if (tracks.groups.length > 0 && tracks.groups[0].genes.length > 0) {
      // alert how many tracks were returned
      let num = (new Set(tracks.groups.map(g => g.id))).size - 1;
      this._alerts.pushAlert(new Alert(
        (num) ? ((this._numReturned == num) ? ALERT_SUCCESS : ALERT_INFO) :
          ALERT_WARNING,
        this._numReturned + ' tracks returned; ' + num + ' aligned'
      ));
      // only selectively color when there are results
      let familySizes = (tracks.groups.length > 1)
                      ? getFamilySizeMap(tracks)
                      : undefined;

      let i = tracks.groups[0].genes.map(g => g.name).indexOf(this.routeGene);
      let focus = tracks.groups[0].genes[i];
      this.legendArgs = {
        autoResize: true,
        familyClick: function (f) {
          this.selectFamily(f);
        }.bind(this),
        highlight: [focus.family],
        selectiveColoring: familySizes
      };

      this.plotArgs = {
        autoResize: true,
        geneClick: function (g) {
          this.selectGene(g);
        }.bind(this),
        outlier: -1,
        plotClick: function (p) {
          this.selectPlot(p);
        }.bind(this),
        selectiveColoring: familySizes
	    }

      this.microArgs = {
        autoResize: true,
        boldFirst: true,
        geneClick: function (g) {
          this.selectGene(g);
        }.bind(this),
        highlight: [this.routeGene],
        plotClick: function (p) {
          this.selectPlot(p);
        }.bind(this),
        nameClick: function (t) {
          this.selectTrack(t);
        }.bind(this),
        selectiveColoring: familySizes
      };

      this.queryGenes = tracks.groups[0].genes;
      this.macroArgs = {
        autoResize: true,
        viewport: {
          start: this.queryGenes[0].fmin,
          stop: this.queryGenes[this.queryGenes.length - 1].fmax
        },
        viewportDrag: function (d1, d2) {
          this._viewportDrag(d1, d2);
        }.bind(this)
      };

      this.microTracks = tracks;
    }
    this.hideLeftSlider();
  }

  private _onPlots(plots): void { this.microPlots = plots; }

  private _onPlotSelection(plot): void {
    this.selectedLocal = this.selectedGlobal = undefined;
    if (this.selectedPlot == this.plotTypes.GLOBAL) this.showGlobalPlot();
    else this.showLocalPlot();
  }

  private _onMacroTracks(tracks): void { this.macroTracks = tracks; }

  ngOnInit(): void {
    // initialize UI
    this._initUI();

    // subscribe to parameter changes
    this._route.params.subscribe(this._onParams.bind(this));

    // subscribe to micro-tracks changes
    this._microTracksService.tracks.subscribe(this._onRawMicroTracks.bind(this));
    this._microTracks = Observable.combineLatest(
      this._alignmentService.tracks,
      this._filterService.regexp,
      this._filterService.order
    ).let(microTracksSelector({skipFirst: true}));
    this._microTracks.subscribe(this._onAlignedMicroTracks.bind(this));

    // subscribe to micro-plots changes
    this._microPlots = Observable.combineLatest(
      this._plotsService.localPlots,
      this._microTracks,
    ).let(plotsSelector());
    this._microPlots.subscribe(this._onPlots.bind(this));
    this._plotsService.selectedPlot.subscribe(this._onPlotSelection.bind(this));

    // subscribe to macro-track changes
    this._macroTracks = Observable.combineLatest(
      this._macroTracksService.tracks,
      this._microTracks
    ).let(macroTracksSelector());
    this._macroTracks.subscribe(this._onMacroTracks.bind(this));
  }

  // private

  private _errorAlert(message: string): void {
    this._alerts.pushAlert(new Alert(ALERT_DANGER, message));
  }

  private _splitViewers(): void {
    if (this._splitTop !== undefined && this._splitBottom !== undefined) {
      let topEl = this._splitTop.nativeElement,
          bottomEl = this._splitBottom.nativeElement;
      let parseSize = (el): number => {
        let regexp = new RegExp(/calc\(|\%(.*)/, 'g');
        return parseFloat(el.style.height.replace(regexp, ''));
      }
      Split([topEl, bottomEl], {
        sizes: [this._splitTopSize, this._splitBottomSize],
        direction: 'vertical',
        minSize: 0,
        onDragEnd: () => {
          this._splitTopSize = parseSize(topEl);
          this._splitBottomSize = parseSize(bottomEl);
        }
      });
    }
  }

  private _viewportDrag(d1, d2): void {
    let server = this.routeSource;
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
          this._errorAlert(m);
        }.bind(this, macroBack)
      );
    }
  }

  // public

  invalidate(): void {
    this.macroTracks = this.microPlots = this.microTracks = undefined;
  }

  // main content

  drawPlots(): void {
    this.plotComponents.forEach(p => {
      p.draw();
    });
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
    this.showRightSlider();
  }

  showGlobalPlot(): void {
    this.selectedPlot = this.plotTypes.GLOBAL;
    this._plotsService.getSelectedGlobal(plot => {
      this.selectedGlobal = plot;
    });
  }

  showLocalPlot(): void {
    this.selectedPlot = this.plotTypes.LOCAL;
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

  // right slider
  hideRightSlider(): void {
    this.rightSliderHidden = true;
  }

  showRightSlider(): void {
    this.rightSliderHidden = false;
  }

  toggleRightSlider(): void {
    if (this.rightSliderHidden) this.showRightSlider();
    else this.hideRightSlider();
  }

  // help button
  help(): void {
    this._showHelp.next(true);
  }
}
