// Angular
import { Component, EventEmitter, OnDestroy, OnInit, Output } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
// App
import { AppConfig } from "../../app.config";
import { BlockParams, ClusteringParams, QueryParams } from "../../models";
import { ClusteringService, MacroTracksService, MicroTracksService } from "../../services";

@Component({
  moduleId: module.id.toString(),
  selector: "multi-params",
  styleUrls: [ "./multi-params.component.scss" ],
  templateUrl: "./multi-params.component.html",
})
export class MultiParamsComponent implements OnDestroy, OnInit {

  // IO
  @Output() invalid = new EventEmitter();
  @Output() valid   = new EventEmitter();

  // UI
  blockHelp = false;
  queryHelp = false;
  clusteringHelp = false;

  // form groups
  blockGroup: FormGroup;
  queryGroup: FormGroup;
  clusteringGroup: FormGroup;

  // form data
  sources = AppConfig.SERVERS.filter((s) => s.hasOwnProperty("microMulti"));

  // emits when the component is destroyed
  private destroy: Subject<boolean>;

  // constructor
  constructor(private clusteringService: ClusteringService,
              private fb: FormBuilder,
              private macroTracksService: MacroTracksService,
              private microTracksService: MicroTracksService) {
    this.destroy = new Subject();
  }

  // Angular hooks

  ngOnInit(): void {
    // initialize block group and subscribe to store updates
    const defaultBlock = new BlockParams();
    this.blockGroup  = this.fb.group(defaultBlock.formControls());
    this.macroTracksService.blockParams
      .pipe(takeUntil(this.destroy))
      .subscribe((params) => this._updateGroup(this.blockGroup, params));

    // initialize query group and subscribe to store updates
    const defaultQuery = new QueryParams();
    this.queryGroup  = this.fb.group(defaultQuery.formControls());
    this.microTracksService.queryParams
      .pipe(takeUntil(this.destroy))
      .subscribe((params) => this._updateGroup(this.queryGroup, params));

    // initialize clustering group and subscribe to store updates
    const defaultClustering = new ClusteringParams();
    this.clusteringGroup  = this.fb.group(defaultClustering.formControls());
    this.clusteringService.clusteringParams
      .pipe(takeUntil(this.destroy))
      .subscribe((params) => this._updateGroup(this.clusteringGroup, params));

    // submit the updated form
    this.blockGroup.markAsDirty();
    this.queryGroup.markAsDirty();
    this.clusteringGroup.markAsDirty();
    this.submit();
  }

  ngOnDestroy(): void {
    this.destroy.next(true);
  }

  // public

  submit(): void {
    if (this.blockGroup.valid && this.queryGroup.valid && this.clusteringGroup.valid) {
      this.valid.emit();
      // submit block params
      this._submitGroup(this.blockGroup, (params) => {
        this.macroTracksService.updateParams(params);
      });
      // submit query params
      this._submitGroup(this.queryGroup, (params) => {
        this.microTracksService.updateParams(params);
      });
      // submit clustering params
      this._submitGroup(this.clusteringGroup, (params) => {
        this.clusteringService.updateParams(params);
      });
    } else {
      this.invalid.emit();
    }
  }

  // private

  private _updateGroup(group, params) {
    group.patchValue(params);
  }

  private _submitGroup(group, callback): void {
    if (group.dirty) {
      const params = group.getRawValue();
      callback(params);
      group.reset(params);
    }
  }
}
