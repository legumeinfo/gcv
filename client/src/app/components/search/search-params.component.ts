// Angular
import { BehaviorSubject }        from 'rxjs/BehaviorSubject';
import { Component,
         EventEmitter,
         Input,
         OnChanges,
         OnDestroy,
         OnInit,
         Output,
         SimpleChanges }          from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

// App services
import { Alert }                 from '../../models/alert.model';
import { Alerts }                from '../../constants/alerts';
import { AlertsService }         from '../../services/alerts.service';
import { ALIGNMENT_ALGORITHMS }  from '../../constants/alignment-algorithms';
import { AlignmentParams }       from '../../models/alignment-params.model';
import { AlignmentService }      from '../../services/alignment.service';
import { AppConfig }             from '../../app.config';
import { BlockParams }           from '../../models/block-params.model';
import { DefaultAlignmentParams, DefaultBlockParams,
         DefaultQueryParams }    from '../../constants/default-parameters';
import { MacroTracksService }    from '../../services/macro-tracks.service';
import { MicroTracksService }    from '../../services/micro-tracks.service';
import { QueryParams }           from '../../models/query-params.model';
//import { UrlService }            from '../../services/url.service';

@Component({
  moduleId: module.id.toString(),
  selector: 'search-params',
  templateUrl: 'search-params.component.html',
  styleUrls: [ 'search-params.component.css' ]
})

//export class SearchParamsComponent implements OnChanges, OnDestroy, OnInit {
export class SearchParamsComponent implements OnInit {

  // component IO

  @Input() source: string;
  @Input() gene: string;
  @Output() invalid = new EventEmitter();
  @Output() submitted = new EventEmitter();

  // component variables

  blockHelp = false;
  queryHelp = false;
  alignmentHelp = false;

  blockGroup: FormGroup;
  queryGroup: FormGroup;
  alignmentGroup: FormGroup;

  sources = AppConfig.SERVERS.filter(s => s.hasOwnProperty('microSearch'));
  algorithms = ALIGNMENT_ALGORITHMS;

  //private _sub: any;

  // constructor

  constructor(private _alerts: AlertsService,
              private _alignmentService: AlignmentService,
              private _fb: FormBuilder,
              private _macroTracksService: MacroTracksService,
              private _microTracksService: MicroTracksService) { }

  // Angular hooks

  //ngOnChanges(changes: SimpleChanges) {
  //  if (this.queryGroup !== undefined)
  //    this._geneSearch();
  //}

  //ngOnDestroy(): void {
  //  this._sub.unsubscribe();
  //}

  ngOnInit(): void {
    // initialize block group and subscribe to store updates
    let defaultBlock = new BlockParams();
    this.blockGroup = this._fb.group(defaultBlock.formControls());
    this._macroTracksService.blockParams.subscribe(params => {
      this._updateGroup(this.blockGroup, params);
    });

    // initialize query group and subscribe to store updates
    let defaultQuery = new QueryParams();
    this.queryGroup = this._fb.group(defaultQuery.formControls());
    this._microTracksService.queryParams.subscribe(params => {
      this._updateGroup(this.queryGroup, params);
    });

    // initialize alignment group and subscribe to store updates
    let defaultAlignment = new AlignmentParams();
    this.alignmentGroup = this._fb.group(defaultAlignment.formControls());
    this._alignmentService.alignmentParams.subscribe(params => {
      this._updateGroup(this.alignmentGroup, params);
    });

    // subscribe to url query param updates
    //this._sub = this._url.params.subscribe(params => {
    //  // update block params
    //  this._paramUpdateGroup(this.blockGroup, params);
    //  // update query params
    //  this._paramUpdateGroup(this.queryGroup, params);
    //  // update alignment params
    //  this._paramUpdateGroup(this.alignmentGroup, params);
    //  // resubmit the params form if necessary
    //  if (this.blockGroup.dirty || this.queryGroup.dirty ||
    //  this.alignmentGroup.dirty)
    //    this.submit();
    //});

    // submit the updated form
    this.blockGroup.markAsDirty();
    this.queryGroup.markAsDirty();
    this.alignmentGroup.markAsDirty();
    this.submit();
  }

  // private

  private _updateGroup(group, params) {
    group.patchValue(params);
  }

  //private _geneSearch(): void {
  //  this._microTracksService.geneSearch(
  //    this.source,
  //    this.gene,
  //    this.queryGroup.getRawValue(),
  //    e => this._alerts.pushAlert(new Alert(Alerts.ALERT_DANGER, e))
  //  );
  //}

  //private _paramUpdateGroup(group, params): void {
  //  let oldValue = group.getRawValue();
  //  group.patchValue(params);
  //  let newValue = group.getRawValue();
  //  if (JSON.stringify(oldValue) !== JSON.stringify(newValue))
  //    group.markAsDirty();
  //}

  private _submitGroup(group, callback=params=>{}): void {
    if (group.dirty) {
      //this.submitted.emit();
      let params = group.getRawValue();
      callback(params);
      group.reset(params);
      //this._url.updateParams(Object.assign({}, params));
    }
  }

  // public

  submit(): void {
    if (this.blockGroup.valid && this.queryGroup.valid &&
    this.alignmentGroup.valid) {
      // submit block params
      this._submitGroup(this.blockGroup, params => {
        this._macroTracksService.updateParams(params);
      });
      // submit query params
      this._submitGroup(this.queryGroup, params => {
        //this.submitted.emit();
        //this._geneSearch()
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
