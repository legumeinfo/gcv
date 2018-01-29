// Angular
import { Component,
         EventEmitter,
         OnInit,
         Output }                 from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

// App
import { AppConfig }          from '../../app.config';
import { ClusteringParams }   from '../../models/clustering-params.model';
import { ClusteringService }  from '../../services/clustering.service';
import { MicroTracksService } from '../../services/micro-tracks.service';
import { QueryParams }        from '../../models/query-params.model';

@Component({
  moduleId: module.id.toString(),
  selector: 'multi-params',
  templateUrl: 'multi-params.component.html',
  styleUrls: [ 'multi-params.component.css' ]
})

export class MultiParamsComponent implements OnInit {
  // IO
  @Output() invalid = new EventEmitter();
  @Output() valid   = new EventEmitter();

  // UI
  help = false;

  // form groups
  queryGroup: FormGroup;
  clusteringGroup: FormGroup;

  // form data
  sources = AppConfig.SERVERS.filter(s => s.hasOwnProperty('microMulti'));

  // constructor
  constructor(private _clusteringService: ClusteringService,
              private _fb: FormBuilder,
              private _microTracksService: MicroTracksService) { }

  // Angular hooks

  ngOnInit(): void {
    // initialize query group and subscribe to store updates
    let defaultQuery = new QueryParams();
    this.queryGroup  = this._fb.group(defaultQuery.formControls());
    this._microTracksService.queryParams
      .subscribe(params => this._updateGroup(this.queryGroup, params));

    // initialize clustering group and subscribe to store updates
    let defaultClustering = new ClusteringParams();
    this.clusteringGroup  = this._fb.group(defaultClustering.formControls());
    this._clusteringService.clusteringParams
      .subscribe(params => this._updateGroup(this.queryGroup, params));

    // submit the updated form
    this.queryGroup.markAsDirty();
    this.clusteringGroup.markAsDirty();
    this.submit();
  }

  // private

  private _updateGroup(group, params) {
    group.patchValue(params);
  }

  private _submitGroup(group, callback=params=>{}): void {
    if (group.dirty) {
      let params = group.getRawValue();
      callback(params);
      group.reset(params);
    }
  }

  // public

  submit(): void {
    if (this.queryGroup.valid && this.clusteringGroup.valid) {
      this.valid.emit();
      // submit query params
      this._submitGroup(this.queryGroup, params => {
        this._microTracksService.updateParams(params);
      });
      // submit clustering params
      this._submitGroup(this.clusteringGroup, params => {
        this._clusteringService.updateParams(params);
      });
    } else {
      this.invalid.emit();
    }
  }
}
