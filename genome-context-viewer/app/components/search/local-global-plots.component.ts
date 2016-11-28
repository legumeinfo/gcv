import { Component, OnInit } from '@angular/core';

@Component({
  moduleId: module.id,
  selector: 'local-global-plots',
  templateUrl: 'local-global-plots.component.html',
  styleUrls: [ 'local-global-plots.component.css' ]
})

export class LocalGlobalPlotsComponent implements OnInit {
  plot = 'local';

  ngOnInit(): void {
    // get local plot data?
  }
}
