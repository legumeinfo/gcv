// Angular
import { Component, OnInit } from '@angular/core';

// App services
import { MicroTracksService } from '../../services/micro-tracks.service';

@Component({
  moduleId: module.id,
  selector: 'basic-params',
  templateUrl: 'basic-params.component.html',
  styleUrls: [ 'basic-params.component.css' ]
})

export class BasicParamsComponent implements OnInit {
  constructor(private tracksService: MicroTracksService) {
    //tracksService.loadTracks();  // TODO: pass params as arg
  }

  ngOnInit(): void {
    // get data from service or location or location storage?
  }

  submit(): void {
    //tracksService.loadTracks();
  }
}
