// Angular + dependencies
import { ActivatedRoute, Params } from '@angular/router';
import { BehaviorSubject }        from 'rxjs/BehaviorSubject';
import { Component,
         ElementRef,
         OnInit,
         ViewChild,
         ViewEncapsulation }      from '@angular/core';
import { Observable }             from 'rxjs/Observable';
import * as Split                 from 'split.js';
import * as d3                    from 'd3';
import { GCV }                    from '../../../assets/js/gcv';

// App
import { Alert }                     from '../../models/alert.model';
import { Alerts }                    from '../../constants/alerts';
import { AlertsService }             from '../../services/alerts.service';
import { ClusteringService }         from '../../services/clustering.service';
import { Family }                    from '../../models/family.model';
import { FilterService }             from '../../services/filter.service';
import { frequentedRegionsSelector } from '../../selectors/frequented-regions.selector';
import { Gene }                      from '../../models/gene.model';
import { Group }                     from '../../models/group.model';
import { MicroTracks }               from '../../models/micro-tracks.model';
import { microTracksSelector }       from '../../selectors/micro-tracks.selector';
import { MicroTracksService }        from '../../services/micro-tracks.service';

enum AccordionTypes {
  REGEXP,
}

@Component({
  moduleId: module.id.toString(),
  selector: 'basic',
  templateUrl: 'basic.component.html',
  styleUrls: [ 'basic.component.css' ],
  encapsulation: ViewEncapsulation.None
})

export class BasicComponent implements OnInit {
  // view children

  // EVIL: ElementRefs nested in switch cases are undefined when parent or child
  // AfterViewInit hooks are called, so routines that depend on them are called
  // via their setters.
  private _left: ElementRef;
  @ViewChild('left')
  set left(el: ElementRef) {
    this._left = el;
    this._splitViewers();
  }
  private _right: ElementRef;
  @ViewChild('right')
  set right(el: ElementRef) {
    this._right = el;
    this._splitViewers();
  }

  // UI

  selectedDetail;

  accordionTypes = AccordionTypes;
  accordion = null;

  private _showHelp = new BehaviorSubject<boolean>(true);
  showHelp = this._showHelp.asObservable();

  // data
  queryGenes: string[];

  private _groupedTracks: Observable<MicroTracks>;
  private _microTracks: Observable<MicroTracks>;
  microTracks: MicroTracks;
  microLegend: any;

  // viewers
  microColors = GCV.common.colors;

  microArgs: any;

  microLegendArgs: any;

  // constructor

  constructor(private _route: ActivatedRoute,
              private _alerts: AlertsService,
              private _clusteringService: ClusteringService,
              private _filterService: FilterService,
              private _microTracksService: MicroTracksService) { }

  // Angular hooks

  private _onParams(params): void {
    this.invalidate();
    this.queryGenes = params['genes'].split(',');
  }

  private _onMicroTracks(tracks): void {
    let num = tracks.groups.length;
    this._alerts.pushAlert(new Alert(
      (num) ? Alerts.ALERT_SUCCESS : Alerts.ALERT_WARNING,
      num + ' tracks returned'
    ));
    // only selectively color when there are results
    let familySizes = (tracks.groups.length > 1)
                      ? GCV.common.getFamilySizeMap(tracks)
                      : undefined;
    let highlight = tracks.groups.reduce((l, group) => {
      let families = group.genes
        .filter(g => this.queryGenes.indexOf(g.name) !== -1)
        .map(g => g.family);
      return l.concat(families);
    }, []);
    this.microArgs = {
      geneClick: function (g, track) {
        this.selectGene(g);
      }.bind(this),
      nameClick: function (t) {
        this.selectTrack(t);
      }.bind(this),
      autoResize: true,
      selectiveColoring: familySizes,
      highlight: this.queryGenes
    };

    this.microTracks = tracks;
    var orderedUniqueFamilyIds = new Set();
    this.microTracks.groups.forEach(group => {
      group.genes.forEach(gene => {
        orderedUniqueFamilyIds.add(gene.family);
      });
    });
    var familyMap = {};
    this.microTracks.families.forEach(f => {
      familyMap[f.id] = f;
    });
    var uniqueFamilies = [];
    orderedUniqueFamilyIds.forEach(id => {
      if (familyMap[id] !== undefined) uniqueFamilies.push(familyMap[id]);
    });

    var d = ",";
    var singletonIds = ["singleton"].concat(uniqueFamilies.filter(f => {
      return familySizes[f.id] == 1;
    }).map(f => f.id)).join(d);
    this.microLegendArgs = {
      autoResize: true,
      keyClick: function (f) {
        this.selectFamily(f);
      }.bind(this),
      highlight: highlight,
      selectiveColoring: familySizes,
      selector: 'family',
      blank: {name: "Singletons", id: singletonIds},
      blankDashed: {name: "Orphans", id: ""},
      multiDelimiter: d
    }
    var presentFamilies = this.microTracks.groups.reduce((l, group) => {
      return l.concat(group.genes.map(g => g.family));
    }, []);
    this.microLegend = uniqueFamilies.filter(f => {
      return presentFamilies.indexOf(f.id) != -1 && f.name != '';
    });
    this.hideLeftSlider();
  }

  ngOnInit(): void {
    // subscribe to parameter changes
    this._route.params.subscribe(this._onParams.bind(this));

    // subscribe to micro-tracks changes
    this._groupedTracks = Observable.combineLatest(
      this._microTracksService.tracks,
      this._clusteringService.clusteringParams
    ).let(frequentedRegionsSelector());
    this._microTracks = Observable.combineLatest(
      this._groupedTracks,
      this._filterService.regexp
    ).let(microTracksSelector());
    this._microTracks.subscribe(this._onMicroTracks.bind(this));
  }

  // private

  private _splitViewers(): void {
    if (this._left !== undefined && this._right !== undefined) {
      let leftEl = this._left.nativeElement,
          rightEl = this._right.nativeElement;
      Split([leftEl, rightEl], {
        sizes: [70, 30],
        gutterSize: 8,
        cursor: 'col-resize',
        minSize: 0
      })
    }
  }

  // public

  invalidate(): void {
    this.microTracks = undefined;
  }

  // micro-synteny
  setAccordion(e: any, value: any): void {
    e.stopPropagation();
    this.accordion = this.accordion == value ? null : value;
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

  // help button
  help(): void {
    this._showHelp.next(true);
  }
}
