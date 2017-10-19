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
import { Alert }                  from '../../models/alert.model';
import { Alerts }                 from '../../constants/alerts';
import { AlertsService }          from '../../services/alerts.service';
import { AppConfig }              from '../../app.config';
import { ClusteringParams }       from '../../models/clustering-params.model';
import { ClusteringService }      from '../../services/clustering.service';
import { DefaultClusteringParams,
         DefaultQueryParams }     from '../../constants/default-parameters';
import { MicroTracksService }     from '../../services/micro-tracks.service';
import { QueryParams }            from '../../models/query-params.model';
import { UrlQueryParamsService }  from '../../services/url-query-params.service';

@Component({
  moduleId: module.id.toString(),
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
  clusteringGroup: FormGroup;

  sources = AppConfig.SERVERS.filter(s => s.hasOwnProperty('microBasic'));

  private _sub: any;

  // constructor

  constructor(private _alerts: AlertsService,
              private _clusteringService: ClusteringService,
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
      DefaultQueryParams.DEFAULT_NEIGHBORS,
      [DefaultQueryParams.DEFAULT_SOURCE] as string[]);
    this.queryGroup = this._fb.group(defaultQuery.formControls());
    let defaultClustering = new ClusteringParams(
      DefaultClusteringParams.DEFAULT_ALPHA,
      DefaultClusteringParams.DEFAULT_KAPPA,
      DefaultClusteringParams.DEFAULT_MINSUP,
      DefaultClusteringParams.DEFAULT_MINSIZE);
    this.clusteringGroup = this._fb.group(defaultClustering.formControls());
    // subscribe to url query param updates
    this._sub = this._url.params.subscribe(params => {
      let oldQuery = this.queryGroup.getRawValue();
      this.queryGroup.patchValue(params);
      let newQuery = this.queryGroup.getRawValue();
      if (JSON.stringify(oldQuery) !== JSON.stringify(newQuery))
        this.queryGroup.markAsDirty();
      let oldClustering = this.clusteringGroup.getRawValue();
      this.clusteringGroup.patchValue(params);
      let newClustering = this.clusteringGroup.getRawValue();
      if (JSON.stringify(oldClustering) !== JSON.stringify(newClustering))
        this.clusteringGroup.markAsDirty();
      if (this.queryGroup.dirty || this.clusteringGroup.dirty)
        this.submit();
    });
    // submit the updated form
    this.queryGroup.markAsDirty();
    this.clusteringGroup.markAsDirty();
    this.submit();
  }

  // private

  private _basicQuery(): void {
    this._tracksService.basicQuery(
      this.queryGenes,
      this.queryGroup.getRawValue(),
      e => this._alerts.pushAlert(new Alert(Alerts.ALERT_DANGER, e))
    );
  }

  // public

  submit(): void {
    if (this.queryGroup.valid && this.clusteringGroup.valid) {
      if (this.queryGroup.dirty) {
        this.submitted.emit();
        let params = this.queryGroup.getRawValue();
        this._basicQuery();
        this.queryGroup.reset(params);
        this._url.updateParams(Object.assign({}, params));
      }
      if (this.clusteringGroup.dirty) {
        this.submitted.emit();
        let params = this.clusteringGroup.getRawValue();
        this._clusteringService.updateParams(params);
        this.clusteringGroup.reset(params);
        this._url.updateParams(Object.assign({}, params));
      }
    } else {
      this.invalid.emit();
    }
  }
}
