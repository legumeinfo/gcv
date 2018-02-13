// Angular
import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";

// App
import { AppConfig } from "../../app.config";
import { ClusteringParams } from "../../models/clustering-params.model";
import { QueryParams } from "../../models/query-params.model";
import { ClusteringService } from "../../services/clustering.service";
import { MicroTracksService } from "../../services/micro-tracks.service";

@Component({
  moduleId: module.id.toString(),
  selector: "multi-params",
  styles: [ require("./multi-params.component.scss") ],
  template: require("./multi-params.component.html"),
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
  sources = AppConfig.SERVERS.filter((s) => s.hasOwnProperty("microMulti"));

  // constructor
  constructor(private clusteringService: ClusteringService,
              private fb: FormBuilder,
              private microTracksService: MicroTracksService) { }

  // Angular hooks

  ngOnInit(): void {
    // initialize query group and subscribe to store updates
    const defaultQuery = new QueryParams();
    this.queryGroup  = this.fb.group(defaultQuery.formControls());
    this.microTracksService.queryParams
      .subscribe((params) => this._updateGroup(this.queryGroup, params));

    // initialize clustering group and subscribe to store updates
    const defaultClustering = new ClusteringParams();
    this.clusteringGroup  = this.fb.group(defaultClustering.formControls());
    this.clusteringService.clusteringParams
      .subscribe((params) => this._updateGroup(this.queryGroup, params));

    // submit the updated form
    this.queryGroup.markAsDirty();
    this.clusteringGroup.markAsDirty();
    this.submit();
  }

  // public

  submit(): void {
    if (this.queryGroup.valid && this.clusteringGroup.valid) {
      this.valid.emit();
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
