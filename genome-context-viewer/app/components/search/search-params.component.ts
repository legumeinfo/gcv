// Angular
import { ActivatedRoute }               from '@angular/router';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router }                       from '@angular/router';

// App services
import { ALIGNMENT_ALGORITHMS } from '../../services/alignment-algorithms';
import { AlignmentParams }      from '../../services/alignment-params';
import { MicroTracksService }   from '../../services/micro-tracks.service';
import { QueryParams }          from '../../services/query-params';
import { SERVERS }              from '../../services/servers';

@Component({
  moduleId: module.id,
  selector: 'search-params',
  templateUrl: 'search-params.component.html',
  styleUrls: [ 'search-params.component.css' ]
})

export class SearchParamsComponent implements OnDestroy, OnInit {
  queryHelp = false;
  alignmentHelp = false;

  query = new QueryParams(5, ['lis'], 2, 2);
  alignment = new AlignmentParams('smith-waterman', 5, -1, -1, 25, 10);

  algorithms = ALIGNMENT_ALGORITHMS;
  sources = SERVERS.filter(s => s.hasOwnProperty('microBasic'));

  private sub: any;
  private params: any;

  constructor(private route: ActivatedRoute,
              private router: Router,
              private tracksService: MicroTracksService) { }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  ngOnInit(): void {
    this.sub = this.route.queryParams.subscribe(params => {
      this.params = Object.assign({}, params);
      // update query params
      if (params['neighbors'])
        this.query.neighbors = +params['neighbors'];
      if (params['sources'])
        this.query.sources = params['sources'].split(',');
      if (params['matched'])
        this.query.matched = +params['matched'];
      if (params['intermediate'])
        this.query.intermediate = +params['intermediate'];
      // update alignment params
      if (params['algorithm'])
        this.alignment.algorithm = params['algorithm'];
      if (params['match'])
        this.alignment.match = +params['match'];
      if (params['mismatch'])
        this.alignment.mismatch = +params['mismatch'];
      if (params['gap'])
        this.alignment.gap = +params['gap'];
      if (params['score'])
        this.alignment.score = +params['score'];
      if (params['threshold'])
        this.alignment.threshold = +params['threshold'];
      // submit the updated form
      this.submit();
    });
  }

  // Hack the multiple select into submission since Angular 2 lacks support
  setSelected(options: any[]): void {
    this.query.sources = [];
    for (var i = 0; i < options.length; i++) {
      var o = options[i];
      if (o.selected === true)
        this.query.sources.push(this.sources[i].id)
    }
  }

  submit(): void {
    this.router.navigate([], {queryParams: Object.assign(
      this.params,
      this.query.toUrlSafe(),
      this.alignment
    )});
    // TODO: load/align only if respective parameters changed
    //tracksService.loadTracks(this.query);
    //tracksService.alignTracks(this.alignment);
  }
}
