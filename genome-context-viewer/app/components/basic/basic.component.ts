// Angular
import { ActivatedRoute, Params } from '@angular/router';
import { BehaviorSubject }        from 'rxjs/BehaviorSubject';
import { Component, OnInit }      from '@angular/core';
import { Observable }             from 'rxjs/Observable';

// App
import { FilterService }       from '../../services/filter.service';
import { MicroTracks }         from '../../models/micro-tracks.model';
import { microTracksSelector } from '../../selectors/micro-tracks.selector';
import { MicroTracksService }  from '../../services/micro-tracks.service';

@Component({
  moduleId: module.id,
  selector: 'basic',
  templateUrl: 'basic.component.html',
  styleUrls: [ 'basic.component.css' ]
})

export class BasicComponent implements OnInit {
  private _urlParams: Observable<Params>;
  private _queryGenes: BehaviorSubject<Array<string>> = new BehaviorSubject([]);
  queryGenes: Observable<Array<string>> = this._queryGenes.asObservable();

  tracks: Observable<MicroTracks>;
  microArgs = {
    'highlight': [],
    'geneClicked': function () {},
    'leftAxisClicked': function () {},
    'autoResize': true
  };

  constructor(private _route: ActivatedRoute,
              private _filterService: FilterService,
              private _microTracksService: MicroTracksService) { }

  ngOnInit(): void {
    this._urlParams = this._route.params;
    // subscribe to url param updates
    this._urlParams.subscribe(params => {
      let queryGenes = params['genes'].split(',');
      this.microArgs.highlight = queryGenes;
      this._queryGenes.next(queryGenes);
    });
    this.tracks = Observable.combineLatest(
      this._microTracksService.tracks,
      this._filterService.regexp
    ).let(microTracksSelector());
  }
}
