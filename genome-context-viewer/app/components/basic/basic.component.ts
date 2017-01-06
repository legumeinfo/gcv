// Angular
import { ActivatedRoute, Params } from '@angular/router';
import { BehaviorSubject }        from 'rxjs/BehaviorSubject';
import { Component, OnInit }      from '@angular/core';
import { Observable }             from 'rxjs/Observable';

// App
import { Alert }               from '../../models/alert.model';
import { ALERT_SUCCESS,
         ALERT_INFO,
         ALERT_WARNING,
         ALERT_DANGER }        from '../../constants/alerts';
import { AlertsService }       from '../../services/alerts.service';
import { Family }              from '../../models/family.model';
import { FilterService }       from '../../services/filter.service';
import { Gene }                from '../../models/gene.model';
import { Group }               from '../../models/group.model';
import { MicroTracks }         from '../../models/micro-tracks.model';
import { microTracksSelector } from '../../selectors/micro-tracks.selector';
import { MicroTracksService }  from '../../services/micro-tracks.service';

declare var d3: any;
declare var contextColors: any;

@Component({
  moduleId: module.id,
  selector: 'basic',
  templateUrl: 'basic.component.html',
  styleUrls: [ 'basic.component.css' ]
})

export class BasicComponent implements OnInit {
  // UI

  selectedDetail;

  rightSliderHidden: boolean;

  private _showHelp = new BehaviorSubject<boolean>(true);
  showHelp = this._showHelp.asObservable();

  // data
  private _urlParams: Observable<Params>;
  queryGenes: string[];

  private _microTracks: Observable<MicroTracks>;
  microTracks: MicroTracks;

  // viewers
  colors = contextColors;

  microArgs = {
    highlight: [],
    geneClick: function (g) {
      this.selectGene(g);
    }.bind(this),
    nameClick: function (t) {
      this.selectTrack(t);
    }.bind(this),
    autoResize: true
  };

  legendArgs = {
    familyClick: function (f) {
      this.selectFamily(f);
    }.bind(this),
    autoResize: true
  };

  // constructor

  constructor(private _route: ActivatedRoute,
              private _alerts: AlertsService,
              private _filterService: FilterService,
              private _microTracksService: MicroTracksService) { }

  // Angular hooks

  ngOnInit(): void {
    // ui
    this.hideRightSlider();
    // data
    this._urlParams = this._route.params;
    this._urlParams.subscribe(params => {
      this.invalidate();
      this.queryGenes = params['genes'].split(',');
      this.microArgs.highlight = this.queryGenes;
    });
    this._microTracks = Observable.combineLatest(
      this._microTracksService.tracks,
      this._filterService.regexp
    ).let(microTracksSelector());
    this._microTracks.subscribe(tracks => {
      this.microTracks = tracks;
      let num = tracks.groups.length;
      this._alerts.pushAlert(new Alert(
        (num) ? ALERT_SUCCESS : ALERT_WARNING,
        num + ' tracks returned'
      ));
      this.hideLeftSlider();
    });
  }

  // private

  // public

  invalidate(): void {
    this.microTracks = undefined;
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
