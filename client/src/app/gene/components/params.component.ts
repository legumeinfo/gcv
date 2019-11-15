// Angular
import { Component, EventEmitter, OnDestroy, OnInit, Output } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
// app
import { AppConfig } from "@gcv/app.config";
import { ALIGNMENT_ALGORITHMS } from "@gcv/gene/algorithms";
import { LINKAGES } from '@gcv/gene/constants';
import { AlignmentParams, BlockParams, ClusteringParams, Params, QueryParams,
  SourceParams } from "@gcv/gene/models/params";
import { ParamsService } from "@gcv/gene/services";

@Component({
  selector: "params",
  templateUrl: "./params.component.html",
})
export class ParamsComponent implements OnDestroy, OnInit {

  // component IO
  @Output() invalid = new EventEmitter();
  @Output() valid = new EventEmitter();

  // UI state
  blockHelp = false;
  queryHelp = false;
  clusteringHelp: false;
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
  sources = AppConfig.SERVERS.filter((s) => s.hasOwnProperty("microSearch"));
  algorithms = ALIGNMENT_ALGORITHMS;

  // emits when the component is destroyed
  private _destroy: Subject<boolean> = new Subject();

  // constructor
  constructor(private _paramsService: ParamsService,
              private _fb: FormBuilder) { }

  // Angular hooks

  ngOnInit(): void {
    // initialize form groups
    this._initializeGroup(BlockParams, 'blockGroup', 'getBlockParams');
    this._initializeGroup(QueryParams, 'queryGroup', 'getQueryParams');
    this._initializeGroup(
      ClusteringParams,
      'clusteringGroup',
      'getClusteringParams');
    this._initializeGroup(
      AlignmentParams,
      'alignmentGroup',
      'getAlignmentParams');
    this._initializeGroup(SourceParams, 'sourcesGroup', 'getSourceParams');
    // submit the updated form
    this.submit();
  }

  ngOnDestroy(): void {
    this._destroy.next(true);
    this._destroy.complete();
  }

  // private

  private _initializeGroup<T extends Params>
  (P: {new():T}, group: string, getter: string): void {
    // initialize group and subscribe to store updates
    const defaultParams = new P();
    this[group] = this._fb.group(defaultParams.formControls());
    this._paramsService[getter]()
      .pipe(takeUntil(this._destroy))
      .subscribe(function(group, params) {
        this._updateGroup(this[group], params);
      }.bind(this, group));
    this[group].markAsDirty();
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
        this.alignmentGroup.valid && this.sourcesGroup)
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
