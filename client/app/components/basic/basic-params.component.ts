// Angular
import { Component,
         EventEmitter,
         Input,
         OnChanges,
         OnDestroy,
         OnInit,
         Output,
         SimpleChanges }          from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Observable }             from 'rxjs/Observable';

// App
import { Alert }                 from '../../models/alert.model';
import { ALERT_DANGER }          from '../../constants/alerts';
import { AlertsService }         from '../../services/alerts.service';
import { DEFAULT_NEIGHBORS,
         DEFAULT_SOURCE }     from '../../constants/default-parameters';
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

export class BasicParamsComponent implements OnChanges, OnDestroy, OnInit {
  // IO
  @Input() queryGenes: string[];
  @Output() invalid = new EventEmitter();
  @Output() submitted = new EventEmitter();

  // UI

  help = false;

  // data

  queryGroup: FormGroup;

  sources = SERVERS.filter(s => s.hasOwnProperty('microBasic'));

  private _sub: any;

  // constructor

  constructor(private _alerts: AlertsService,
              private _fb: FormBuilder,
              private _tracksService: MicroTracksService,
              private _url: UrlQueryParamsService) { }

  // Angular hooks

  ngOnChanges(changes: SimpleChanges): void {
    if (this.queryGroup !== undefined)
      this._basicQuery();
  }

  ngOnDestroy(): void {
    this._sub.unsubscribe();
  }

  ngOnInit(): void {
    // initialize forms
    let defaultQuery = new QueryParams(
      DEFAULT_NEIGHBORS,
      [DEFAULT_SOURCE]);
    this.queryGroup = this._fb.group(defaultQuery.formControls());
    // subscribe to url query param updates
    this._sub = this._url.params.subscribe(params => {
      let oldQuery = this.queryGroup.getRawValue();
      this.queryGroup.patchValue(params);
      let newQuery = this.queryGroup.getRawValue();
      if (JSON.stringify(oldQuery) !== JSON.stringify(newQuery))
        this.queryGroup.markAsDirty();
      if (this.queryGroup.dirty)
        this.submit();
    });
    // submit the updated form
    this.queryGroup.markAsDirty();
    this.submit();
  }

  // private

  private _basicQuery(): void {
    this._tracksService.basicQuery(
      this.queryGenes,
      this.queryGroup.getRawValue(),
      e => this._alerts.pushAlert(new Alert(ALERT_DANGER, e))
    );
  }

  // public

  submit(): void {
    if (this.queryGroup.valid) {
      if (this.queryGroup.dirty) {
        this.submitted.emit();
        let params = this.queryGroup.getRawValue();
        this._basicQuery();
        this.queryGroup.reset(params);
        this._url.updateParams(params);
      }
    } else {
      this.invalid.emit();
    }
  }
}
