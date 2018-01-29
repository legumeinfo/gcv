// Angular
import { Component,
         EventEmitter,
         OnInit,
         Output }                 from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

// App services
import { ALIGNMENT_ALGORITHMS } from '../../constants/alignment-algorithms';
import { AlignmentParams }      from '../../models/alignment-params.model';
import { AlignmentService }     from '../../services/alignment.service';
import { AppConfig }            from '../../app.config';
import { BlockParams }          from '../../models/block-params.model';
import { MacroTracksService }   from '../../services/macro-tracks.service';
import { MicroTracksService }   from '../../services/micro-tracks.service';
import { QueryParams }          from '../../models/query-params.model';

@Component({
  moduleId: module.id.toString(),
  selector: 'search-params',
  templateUrl: 'search-params.component.html',
  styleUrls: [ 'search-params.component.css' ]
})

export class SearchParamsComponent implements OnInit {

  // component IO
  @Output() invalid = new EventEmitter();
  @Output() valid   = new EventEmitter();

  // UI state
  blockHelp     = false;
  queryHelp     = false;
  alignmentHelp = false;

  // form groups
  blockGroup: FormGroup;
  queryGroup: FormGroup;
  alignmentGroup: FormGroup;

  // form data
  sources    = AppConfig.SERVERS.filter(s => s.hasOwnProperty('microSearch'));
  algorithms = ALIGNMENT_ALGORITHMS;

  // constructor
  constructor(private _alignmentService: AlignmentService,
              private _fb: FormBuilder,
              private _macroTracksService: MacroTracksService,
              private _microTracksService: MicroTracksService) { }

  // Angular hooks

  ngOnInit(): void {
    // initialize block group and subscribe to store updates
    let defaultBlock = new BlockParams();
    this.blockGroup  = this._fb.group(defaultBlock.formControls());
    this._macroTracksService.blockParams
      .subscribe(params => this._updateGroup(this.blockGroup, params));

    // initialize query group and subscribe to store updates
    let defaultQuery = new QueryParams();
    this.queryGroup  = this._fb.group(defaultQuery.formControls());
    this._microTracksService.queryParams
      .subscribe(params => this._updateGroup(this.queryGroup, params));

    // initialize alignment group and subscribe to store updates
    let defaultAlignment = new AlignmentParams();
    this.alignmentGroup  = this._fb.group(defaultAlignment.formControls());
    this._alignmentService.alignmentParams
      .subscribe(params => this._updateGroup(this.alignmentGroup, params));

    // submit the updated form
    this.blockGroup.markAsDirty();
    this.queryGroup.markAsDirty();
    this.alignmentGroup.markAsDirty();
    this.submit();
  }

  // private

  private _submitGroup(group, callback=params=>{}): void {
    if (group.dirty) {
      let params = group.getRawValue();
      callback(params);
      group.reset(params);
    }
  }

  private _updateGroup(group, params) {
    group.patchValue(params);
  }

  // public

  submit(): void {
    if (this.blockGroup.valid && this.queryGroup.valid &&
    this.alignmentGroup.valid) {
      this.valid.emit();
      // submit block params
      this._submitGroup(this.blockGroup, params => {
        this._macroTracksService.updateParams(params);
      });
      // submit query params
      this._submitGroup(this.queryGroup, params => {
        this._microTracksService.updateParams(params);
      });
      // submit alignment params
      this._submitGroup(this.alignmentGroup, params => {
        this._alignmentService.updateParams(params);
      });
    } else {
      this.invalid.emit();
    }
  }
}
