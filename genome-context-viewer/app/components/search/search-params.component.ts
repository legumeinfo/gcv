// Angular
import { BehaviorSubject }        from 'rxjs/BehaviorSubject';
import { Component,
         Input,
         OnChanges,
         OnDestroy,
         OnInit,
         SimpleChanges }          from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

// App services
import { ALIGNMENT_ALGORITHMS }  from '../../constants/alignment-algorithms';
import { AlignmentParams }       from '../../models/alignment-params.model';
import { AlignmentService }      from '../../services/alignment.service';
import { MicroTracksService }    from '../../services/micro-tracks.service';
import { QueryParams }           from '../../models/query-params.model';
import { SERVERS }               from '../../constants/servers';
import { UrlQueryParamsService } from '../../services/url-query-params.service';

@Component({
  moduleId: module.id,
  selector: 'search-params',
  templateUrl: 'search-params.component.html',
  styleUrls: [ 'search-params.component.css' ]
})

export class SearchParamsComponent implements OnChanges, OnDestroy, OnInit {
  @Input() source: string;
  @Input() gene: string;

  queryHelp = false;
  alignmentHelp = false;

  queryGroup: FormGroup;
  alignmentGroup: FormGroup;

  sources = SERVERS.filter(s => s.hasOwnProperty('microSearch'));
  algorithms = ALIGNMENT_ALGORITHMS;

  private _sub: any;

  private _initialized = false;

  constructor(private _alignmentService: AlignmentService,
              private _fb: FormBuilder,
              private _tracksService: MicroTracksService,
              private _url: UrlQueryParamsService) { }

  ngOnChanges(changes: SimpleChanges) {
    if (this._initialized)
      this._geneSearch();
  }

  ngOnDestroy(): void {
    this._sub.unsubscribe();
  }

  ngOnInit(): void {
    // initialize forms
    let defaultQuery = new QueryParams(5, ['lis'], 2, 2);
    this.queryGroup = this._fb.group(defaultQuery.formControls());
    let defaultAlignment = new AlignmentParams('repeat', 3, -1, -1, 25, 10)
    this.alignmentGroup = this._fb.group(defaultAlignment.formControls());
    // subscribe to url query param updates
    this._sub = this._url.params.subscribe(params => {
      this.queryGroup.patchValue(params);
      this.alignmentGroup.patchValue(params);
    });
    // submit the updated form
    this.submit(true);
    this._initialized = true;
  }

  private _geneSearch(): void {
    this._tracksService.geneSearch(
      this.source,
      this.gene,
      this.queryGroup.getRawValue()
    );
  }

  submit(force = false): void {
    this._url.updateParams(Object.assign({},
      this.queryGroup.getRawValue(),
      this.alignmentGroup.getRawValue()
    ));
    if (this.queryGroup.dirty || force) {
      this._geneSearch();
      this.queryGroup.reset(this.queryGroup.getRawValue());
    }
    if (this.alignmentGroup.dirty || force) {
      this._alignmentService.updateParams(this.alignmentGroup.getRawValue());
      this.alignmentGroup.reset(this.alignmentGroup.getRawValue());
    }
  }
}
