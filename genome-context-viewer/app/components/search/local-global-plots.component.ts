import { Component, OnInit } from '@angular/core';

enum PlotTypes {
  LOCAL,
  GLOBAL
}

@Component({
  moduleId: module.id,
  selector: 'local-global-plots',
  templateUrl: 'local-global-plots.component.html',
  styleUrls: [ 'local-global-plots.component.css' ]
})

export class LocalGlobalPlotsComponent implements OnInit {
  plotTypes = PlotTypes;

  ngOnInit(): void {
    this.showLocal();
  }

  showLocal(): void {
    this.plot = this.plotTypes.LOCAL;
  }

  showGlobal(): void {
    this.plot = this.plotTypes.GLOBAL;
  }
}
