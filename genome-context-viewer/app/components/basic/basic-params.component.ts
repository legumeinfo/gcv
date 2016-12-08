// Angular
import { Component, OnDestroy, OnInit } from '@angular/core';

// App services
import { MicroTracksService }    from '../../services/micro-tracks.service';
import { QueryParams }           from '../../models/query-params.model';
import { SERVERS }               from '../../constants/servers';
import { UrlQueryParamsService } from '../../services/url-query-params.service';

@Component({
  moduleId: module.id,
  selector: 'basic-params',
  templateUrl: 'basic-params.component.html',
  styleUrls: [ 'basic-params.component.css' ]
})

export class BasicParamsComponent implements OnDestroy, OnInit {
  help = false;

  query = new QueryParams(5, ['lis']);

  sources = SERVERS.filter(s => s.hasOwnProperty('microBasic'));

  private _sub: any;

  constructor(private _url: UrlQueryParamsService,
              private _tracksService: MicroTracksService) { }

  ngOnDestroy(): void {
    this._sub.unsubscribe();
  }

  ngOnInit(): void {
    this._sub = this._url.params.subscribe(params => {
      // update the form
      if (params['neighbors'])
        this.query.neighbors = +params['neighbors'];
      if (params['sources'])
        this.query.sources = params['sources'];
    });
    // submit the updated form
    this.submit();
  }

  // Hack the multiple select into submission since Angular 2 lacks support
  setSelected(options: any[]): void {
    this.query.sources = [];
    for (var i = 0; i < options.length; i++) {
      var o = options[i];
      if (o.selected === true)
        this.query.sources.push(this.sources[i].id)
    }
  }

  submit(): void {
    this._url.updateParams(this.query);
    //_tracksService.loadTracks(this.query);
  }
}
