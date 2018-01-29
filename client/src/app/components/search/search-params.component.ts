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
import { UrlQueryParamsService } from '../../services/url-query-params.service';

@Component({
  moduleId: module.id.toString(),
  selector: 'search-params',
  templateUrl: 'search-params.component.html',
  styleUrls: [ 'search-params.component.css' ]
})

export class SearchParamsComponent implements OnChanges, OnDestroy, OnInit {

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

  private _sub: any;

  // constructor

  constructor(private _alerts: AlertsService,
              private _alignmentService: AlignmentService,
              private _fb: FormBuilder,
              private _macroTracksService: MacroTracksService,
              private _microTracksService: MicroTracksService,
              private _url: UrlQueryParamsService) { }

  // Angular hooks

  ngOnChanges(changes: SimpleChanges) {
    if (this.queryGroup !== undefined)
      this._geneSearch();
  }

  ngOnDestroy(): void {
    this._sub.unsubscribe();
  }

  ngOnInit(): void {
    // initialize block form
    let defaultBlock = new BlockParams(
      DefaultBlockParams.DEFAULT_MATCHED,
      DefaultBlockParams.DEFAULT_INTERMEDIATE,
      DefaultBlockParams.DEFAULT_MASK);
    this.blockGroup = this._fb.group(defaultBlock.formControls());

    // initialize query form
    let defaultQuery = new QueryParams(
      DefaultQueryParams.DEFAULT_NEIGHBORS,
      [DefaultQueryParams.DEFAULT_SOURCE] as string[],
      DefaultQueryParams.DEFAULT_MATCHED,
      DefaultQueryParams.DEFAULT_INTERMEDIATE);
    this.queryGroup = this._fb.group(defaultQuery.formControls());

    // initialize alignment form
    let defaultAlignment = new AlignmentParams(
      DefaultAlignmentParams.DEFAULT_ALIGNMENT,
      DefaultAlignmentParams.DEFAULT_MATCH,
      DefaultAlignmentParams.DEFAULT_MISMATCH,
      DefaultAlignmentParams.DEFAULT_GAP,
      DefaultAlignmentParams.DEFAULT_SCORE,
      DefaultAlignmentParams.DEFAULT_THRESHOLD);
    this.alignmentGroup = this._fb.group(defaultAlignment.formControls());

    // subscribe to url query param updates
    this._sub = this._url.params.subscribe(params => {
      // update block params
      this._paramUpdateGroup(this.blockGroup, params);
      // update query params
      this._paramUpdateGroup(this.queryGroup, params);
      // update alignment params
      this._paramUpdateGroup(this.alignmentGroup, params);
      // resubmit the params form if necessary
      if (this.blockGroup.dirty || this.queryGroup.dirty ||
      this.alignmentGroup.dirty)
        this.submit();
    });

    // submit the updated form
    this.blockGroup.markAsDirty();
    this.queryGroup.markAsDirty();
    this.alignmentGroup.markAsDirty();
    this.submit();
  }

  // private

  private _geneSearch(): void {
    this._microTracksService.geneSearch(
      this.source,
      this.gene,
      this.queryGroup.getRawValue(),
      e => this._alerts.pushAlert(new Alert(Alerts.ALERT_DANGER, e))
    );
  }

  private _paramUpdateGroup(group, params): void {
    let oldValue = group.getRawValue();
    group.patchValue(params);
    let newValue = group.getRawValue();
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue))
      group.markAsDirty();
  }

  private _submitGroup(group, callback=params=>{}): void {
    if (group.dirty) {
      //this.submitted.emit();
      let params = group.getRawValue();
      callback(params);
      group.reset(params);
      this._url.updateParams(Object.assign({}, params));
    }
  }

  // public

  submit(): void {
    if (this.queryGroup.valid && this.alignmentGroup.valid) {
      // submit block params
      this._submitGroup(this.blockGroup, params => {
        this._macroTracksService.updateParams(params);
      });
      // submit query params
      this._submitGroup(this.queryGroup, params => {
        this.submitted.emit();
        this._geneSearch()
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
