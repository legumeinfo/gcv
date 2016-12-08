// Angular
import { ActivatedRoute, Params }       from '@angular/router';
import { BehaviorSubject }              from 'rxjs/BehaviorSubject';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup }       from '@angular/forms';

// App services
import { ALIGNMENT_ALGORITHMS }  from '../../constants/alignment-algorithms';
import { AlignmentParams }       from '../../models/alignment-params.model';
import { AlignmentService }      from '../../services/alignment.service';
import { MicroTracksService }    from '../../services/micro-tracks.service';
import { QueryParams }           from '../../models/query-params.model';
import { SERVERS }               from '../../constants/servers';
import { UrlQueryParamsService } from '../../services/url-query-params.service';

@Component({
  moduleId: module.id,
  selector: 'search-params',
  templateUrl: 'search-params.component.html',
  styleUrls: [ 'search-params.component.css' ]
})

export class SearchParamsComponent implements OnDestroy, OnInit {
  queryHelp = false;
  alignmentHelp = false;

  private _urlParams: BehaviorSubject<Params>;

  queryGroup: FormGroup;
  alignmentGroup: FormGroup;

  sources = SERVERS.filter(s => s.hasOwnProperty('microSearch'));
  algorithms = ALIGNMENT_ALGORITHMS;

  private _sub: any;

  constructor(private _route: ActivatedRoute,
              private _alignmentService: AlignmentService,
              private _fb: FormBuilder,
              private _tracksService: MicroTracksService,
              private _url: UrlQueryParamsService) { }

  ngOnDestroy(): void {
    this._sub.unsubscribe();
  }

  ngOnInit(): void {
    // initialize forms
    let defaultQuery = new QueryParams(5, ['lis'], 2, 2);
    this.queryGroup = this._fb.group(defaultQuery.formControls());
    let defaultAlignment = new AlignmentParams('repeat', 3, -1, -1, 25, 10)
    this.alignmentGroup = this._fb.group(defaultAlignment.formControls());
    // downcast observable so we can get the last emitted value on demand
    this._urlParams = <BehaviorSubject<Params>>this._route.params;
    // subscribe to url param updates
    this._urlParams.subscribe(params => {
      this._geneSearch(params['gene']);
    });
    // subscribe to url query param updates
    this._sub = this._url.params.subscribe(params => {
      this.queryGroup.patchValue(params);
      this.alignmentGroup.patchValue(params);
    });
    // submit the updated form
    this.submit();
  }

  private _geneSearch(gene: string): void {
    this._tracksService.geneSearch(gene, this.queryGroup.getRawValue());
  }

  submit(): void {
    this._url.updateParams(Object.assign({},
      this.queryGroup.getRawValue(),
      this.alignmentGroup.getRawValue()
    ));
    if (this.queryGroup.dirty) {
      this._geneSearch(this._urlParams.getValue()['gene']);
      this.queryGroup.reset(this.queryGroup.getRawValue());
    }
    if (this.alignmentGroup.dirty) {
      this._alignmentService.updateParams(this.alignmentGroup.getRawValue());
      this.alignmentGroup.reset(this.alignmentGroup.getRawValue());
    }
  }
}
