// Angular
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
// app
import { AppConfig } from '@gcv/app.config';
import { formControlConfigFactory } from '@gcv/core/models/params';
import { ALIGNMENT_ALGORITHMS } from '@gcv/gene/algorithms';
import { LINKAGES } from '@gcv/gene/constants';
import {
  AlignmentParams, alignmentParamMembers, alignmentParamValidators,
  BlockParams, blockParamMembers, blockParamValidators,
  ClusteringParams, clusteringParamMembers, clusteringParamValidators,
  QueryParams, queryParamMembers, queryParamValidators,
  SourceParams, sourceParamMembers, sourceParamValidators,
} from '@gcv/gene/models/params';
import { ParamsService } from '@gcv/gene/services';


@Component({
  selector: 'gcv-params',
  templateUrl: './params.component.html',
})
export class ParamsComponent implements OnDestroy, OnInit {

  // component IO
  @Output() invalid = new EventEmitter();
  @Output() valid = new EventEmitter();

  // UI state
  blockHelp = false;
  queryHelp = false;
  clusteringHelp = false;
  alignmentHelp = false;
  sourcesHelp = false;

  // form groups
  blockGroup: FormGroup;
  queryGroup: FormGroup;
  clusteringGroup: FormGroup;
  alignmentGroup: FormGroup;
  sourcesGroup: FormGroup;

  // form data
  linkages = LINKAGES;
  sources = AppConfig.SERVERS.filter((s) => s.hasOwnProperty('microSearch'));
  algorithms = ALIGNMENT_ALGORITHMS;

  // emits when the component is destroyed
  private _destroy: Subject<boolean> = new Subject();

  // constructor
  constructor(private _paramsService: ParamsService,
              private _fb: FormBuilder) {
    // initialize form groups
    this.blockGroup =
      this._initializeGroup(blockParamMembers, blockParamValidators);
    this.queryGroup =
      this._initializeGroup(queryParamMembers, queryParamValidators);
    this.clusteringGroup =
      this._initializeGroup(clusteringParamMembers, clusteringParamValidators);
    this.alignmentGroup =
      this._initializeGroup(alignmentParamMembers, alignmentParamValidators);
    this.sourcesGroup =
      this._initializeGroup(sourceParamMembers, sourceParamValidators);
  }

  // Angular hooks

  ngOnInit(): void {
    // update form groups
    this._paramsService.getBlockParams()
      .pipe(takeUntil(this._destroy))
      .subscribe((params: BlockParams) => {
        this._updateGroup(this.blockGroup, params);
      });
    this._paramsService.getQueryParams()
      .pipe(takeUntil(this._destroy))
      .subscribe((params: QueryParams) => {
        this._updateGroup(this.queryGroup, params);
      });
    this._paramsService.getClusteringParams()
      .pipe(takeUntil(this._destroy))
      .subscribe((params: ClusteringParams) => {
        this._updateGroup(this.clusteringGroup, params);
      });
    this._paramsService.getAlignmentParams()
      .pipe(takeUntil(this._destroy))
      .subscribe((params: AlignmentParams) => {
        this._updateGroup(this.alignmentGroup, params);
      });
    this._paramsService.getSourceParams()
      .pipe(takeUntil(this._destroy))
      .subscribe((params: SourceParams) => {
        this._updateGroup(this.sourcesGroup, params);
      });
  }

  ngOnDestroy(): void {
    this._destroy.next(true);
    this._destroy.complete();
  }

  // private

  private _initializeGroup(members, validators): FormGroup {
    const controls = formControlConfigFactory(members, {}, validators);
    return this._fb.group(controls);
  }

  private _submitGroup(group): void {
    if (group.dirty) {
      const params = group.getRawValue();
      this._paramsService.updateParams(params);
      group.reset(params);
    }
  }

  private _updateGroup(group, params) {
    group.patchValue(params);
  }

  // public

  submit(): void {
    if (this.blockGroup.valid && this.queryGroup.valid && this.clusteringGroup &&
        this.alignmentGroup.valid && this.sourcesGroup.valid)
    {
      this.valid.emit();
      // submit params
      this._submitGroup(this.blockGroup);
      this._submitGroup(this.queryGroup);
      this._submitGroup(this.clusteringGroup);
      this._submitGroup(this.alignmentGroup);
      this._submitGroup(this.sourcesGroup);
    } else {
      this.invalid.emit();
    }
  }

}
