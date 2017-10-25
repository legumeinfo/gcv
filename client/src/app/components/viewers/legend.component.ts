// Angular + dependencies
import { Component } from '@angular/core';
import { GCV }       from '../../../assets/js/gcv';

// App
import { Viewer } from './viewer.component';

@Component({
  moduleId: module.id.toString(),
  selector: 'viewer-legend',
  templateUrl: 'viewer.component.html',
  styles: [`
    .viewer {
      position: absolute;
      top: 28px;
      right: 0;
      bottom: 0;
      left: 0;
      overflow-x: hidden;
      overflow-y: auto;
    }
    .viewer /deep/ .GCV {
      float: right;
    }
  `]
})

export class LegendViewerComponent extends Viewer {

  constructor() {
    super('Legend');
  }

  draw(): void {
    if (this.el !== undefined && this.data !== undefined) {
      if (this.viewer !== undefined) {
        this.viewer.destroy();
        this.viewer = undefined;
      }
      this.viewer = new GCV.visualization.Legend(
        this.el.nativeElement,
        this.colors,
        this.data,
        this.args
      );
    }
  }
}
