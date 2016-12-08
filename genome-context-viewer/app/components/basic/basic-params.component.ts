// Angular
import { ActivatedRoute, Params }       from '@angular/router';
import { BehaviorSubject }              from 'rxjs/BehaviorSubject';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup }       from '@angular/forms';

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

  private _urlParams: BehaviorSubject<Params>;

  //query = new QueryParams(5, ['lis']);
  queryGroup: FormGroup;

  sources = SERVERS.filter(s => s.hasOwnProperty('microBasic'));

  private _sub: any;

  constructor(private _route: ActivatedRoute,
              private _fb: FormBuilder,
              private _tracksService: MicroTracksService,
              private _url: UrlQueryParamsService) { }

  ngOnDestroy(): void {
    this._sub.unsubscribe();
  }

  ngOnInit(): void {
    // initialize forms
    let defaultQuery = new QueryParams(5, ['lis']);
    this.queryGroup = this._fb.group(defaultQuery.formControls());
    // downcast observable so we can get the last emitted value on demand
    this._urlParams = <BehaviorSubject<Params>>this._route.params;
    // subscribe to url param updates
    this._urlParams.subscribe(params => {
      this._basicQuery(params['genes']);
    });
    // subscribe to url query param updates
    this._sub = this._url.params.subscribe(params => {
      this.queryGroup.patchValue(params);
    });
    // submit the updated form
    this.submit();
  }

  private _basicQuery(query: string): void {
    let genes: string[] = query.split(',');
    this._tracksService.basicQuery(genes, this.queryGroup.getRawValue());
  }

  submit(): void {
    this._url.updateParams(this.queryGroup.getRawValue());
    if (this.queryGroup.dirty) {
      this._basicQuery(this._urlParams.getValue()['genes']);
      this.queryGroup.reset(this.queryGroup.getRawValue());
    }
  }
}
