// Angular
import { Component, Input, OnInit } from '@angular/core';

// App
import { MicroTracks } from '../../models/micro-tracks.model';

declare var getFamilySizeMap;

@Component({
  moduleId: module.id,
  selector: 'plots',
  templateUrl: 'plots.component.html',
  styleUrls: [ 'plots.component.css' ]
})

export class PlotsComponent implements OnInit{
  @Input() plots: MicroTracks;

  familySizes: any;

  ngOnInit(): void {
    this.familySizes = getFamilySizeMap(this.plots);
  }
}
