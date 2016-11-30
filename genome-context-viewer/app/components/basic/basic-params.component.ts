// Angular
import { ActivatedRoute }               from '@angular/router';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router }                       from '@angular/router';

// App services
import { MicroTracksService } from '../../services/micro-tracks.service';
import { QueryParams }        from '../../services/query-params';
import { SERVERS }            from '../../services/servers';

@Component({
  moduleId: module.id,
  selector: 'basic-params',
  templateUrl: 'basic-params.component.html',
  styleUrls: [ 'basic-params.component.css' ]
})

export class BasicParamsComponent implements OnDestroy, OnInit {
  help = false;

  query = new QueryParams(5, []);

  sources = SERVERS.filter(s => s.hasOwnProperty('microBasic'));

  private sub: any;

  constructor(private route: ActivatedRoute,
              private router: Router,
              private tracksService: MicroTracksService) { }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  ngOnInit(): void {
    this.sub = this.route.queryParams.subscribe(params => {
      // update the form
      if (params['numNeighbors'])
        this.query.numNeighbors = +params['numNeighbors'];
      if (params['sources'])
        this.query.sources = params['sources'].split(',');
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
    this.router.navigate([], {queryParams: this.query.toUrlSafe()});
    //tracksService.loadTracks(this.query);
  }
}
