// Angular
import { Component, OnInit } from '@angular/core';

// App services
import { MicroTracksService } from '../../services/micro-tracks.service';

@Component({
  moduleId: module.id,
  selector: 'search-params',
  templateUrl: 'search-params.component.html',
  styleUrls: [ 'search-params.component.css' ]
})

export class SearchParamsComponent implements OnInit {
  constructor(private tracksService: MicroTracksService) {
    // TODO: set alignment params
    //tracksService.loadTracks();  // TODO: pass params as arg
  }

  ngOnInit(): void {
    // get data from service or url or localstorage?
  }

  submit(): void {
    //tracksService.loadTracks();
  }
}
