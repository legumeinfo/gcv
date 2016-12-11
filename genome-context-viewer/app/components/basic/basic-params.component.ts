// Angular
import { BehaviorSubject }        from 'rxjs/BehaviorSubject';
import { Component,
         Input,
         OnDestroy,
         OnInit,
         SimpleChanges }          from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Observable }             from 'rxjs/Observable';

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
  private _queryGenes: BehaviorSubject<Array<string>>;
  @Input()
  set queryGenes(queryGenes: Observable<Array<string>>) {
    this._queryGenes = <BehaviorSubject<Array<string>>>queryGenes;
  }

  help = false;

  queryGroup: FormGroup;

  sources = SERVERS.filter(s => s.hasOwnProperty('microBasic'));

  private _sub: any;

  constructor(private _fb: FormBuilder,
              private _tracksService: MicroTracksService,
              private _url: UrlQueryParamsService) { }

  ngOnDestroy(): void {
    this._sub.unsubscribe();
  }

  ngOnInit(): void {
    // initialize forms
    let defaultQuery = new QueryParams(5, ['lis']);
    this.queryGroup = this._fb.group(defaultQuery.formControls());
    // subscribe to url query param updates
    this._sub = this._url.params.subscribe(params => {
      this.queryGroup.patchValue(params);
    });
    // subscribe to queryGene changes
    this._queryGenes.subscribe(queryGenes => {
      this._basicQuery(queryGenes);
    });
    // submit the updated form
    this.submit();
  }

  private _basicQuery(queryGenes: string[]): void {
    this._tracksService.basicQuery(queryGenes, this.queryGroup.getRawValue());
  }

  submit(): void {
    this._url.updateParams(this.queryGroup.getRawValue());
    if (this.queryGroup.dirty) {
      this._basicQuery(this._queryGenes.getValue());
      this.queryGroup.reset(this.queryGroup.getRawValue());
    }
  }
}
