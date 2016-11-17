import { Component, OnInit } from '@angular/core';

@Component({
  moduleId: module.id,
  selector: 'micro-viewer',
  template: '<div id="micro-viewer"></div>',
  style: ''
})

export class MicroViewerComponent implements OnInit {
  private draw(): void {
    // draw the viewer
  }

  ngOnInit(): void {
    // get data then draw
  }
}
