// Angular
import { Component,
         ElementRef,
         OnInit,
         ViewChild,
         ViewEncapsulation } from '@angular/core';
import { Observable }        from 'rxjs/Observable';

// App
import { AlignmentService }    from '../../services/alignment.service';
import { FilterService }       from '../../services/filter.service';
import { MacroTracks }         from '../../models/macro-tracks.model';
import { macroTracksSelector } from '../../selectors/macro-tracks.selector';
import { MacroTracksService }  from '../../services/macro-tracks.service';
import { MicroTracks }         from '../../models/micro-tracks.model';
import { microTracksSelector } from '../../selectors/micro-tracks.selector';
import { MicroTracksService }  from '../../services/micro-tracks.service';
import { plotsSelector }       from '../../selectors/plots.selector';
import { PlotsService }        from '../../services/plots.service';

declare var d3: any;
declare var contextColors: any;
declare var Split: any;
declare var getFamilySizeMap: any;
declare var RegExp: any;  // TypeScript doesn't support regexp as argument...

enum ContentTypes {
  VIEWERS,
  PLOTS
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

  // UI

  contentTypes = ContentTypes;
  content;

  // data

  private _microTracks: Observable<MicroTracks>;
  microTracks: MicroTracks;

  private _microPlots: Observable<MicroTracks>;
  microPlots: MicroTracks;

  private _macroTracks: Observable<MacroTracks>;
  macroTracks: MacroTracks;

  // viewers

  familySizes: any;
  colors = contextColors;

  microArgs = {
    highlight: [],
    geneClicked: function () {},
    leftAxisClicked: function () {},
    autoResize: true,
    boldFirst: true
  };

  legendArgs = {
    legendClick: function (family) { },
    selectiveColoring: this.familySizes,
    autoResize: true
  };

  marcoArgs = {autoResize: true};

  // constructor

  constructor(private _alignmentService: AlignmentService,
              private _filterService: FilterService,
              private _macroTracksService: MacroTracksService,
              private _microTracksService: MicroTracksService,
              private _plotsService: PlotsService) { }

  // Angular hooks

  ngOnInit(): void {
    this.showViewers();
    //this.showPlots();
    this._microTracksService.tracks.subscribe(tracks => {
      this._macroTracksService.search(tracks);
    });
    this._microTracks = Observable.combineLatest(
      this._alignmentService.tracks,
      this._filterService.regexp,
      this._filterService.order
    ).let(microTracksSelector({skipFirst: true}));
    this._microTracks.subscribe(tracks => {
      this.familySizes = getFamilySizeMap(tracks);
      this.microTracks = tracks;
    });
    this._microPlots = Observable.combineLatest(
      this._plotsService.localPlots,
      this._microTracks,
    ).let(plotsSelector());
    this._microPlots.subscribe(plots => {
      this.microPlots = plots;
    });
    this._macroTracks = Observable.combineLatest(
      this._macroTracksService.tracks,
      this._microTracks
    ).let(macroTracksSelector());
    this._macroTracks.subscribe(tracks => {
      this.macroTracks = tracks;
    });
  }

  // private

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

  // public

  showViewers(): void {
    this.content = this.contentTypes.VIEWERS;
  }

  showPlots(): void {
    this.content = this.contentTypes.PLOTS;
    this._splitTop = this.splitBottom = undefined;
  }
}
