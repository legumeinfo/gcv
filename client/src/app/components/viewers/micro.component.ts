// Angular + dependencies
import { Component } from '@angular/core';
import { GCV }       from '../../../assets/js/gcv';

// App
import { Viewer }      from './viewer.component';

@Component({
  moduleId: module.id.toString(),
  selector: 'viewer-micro',
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
  `]
})

export class MicroViewerComponent extends Viewer {

  constructor() {
    super('Micro-Synteny');
  }

  draw(): void {
    if (this.el !== undefined && this.data !== undefined) {
      this.destroy();
      var colorDomainStr = localStorage.getItem("viewer-micro-color-domain");
      if (colorDomainStr != null) {
        this.colors.domain(colorDomainStr.split(","));
      }
      this.viewer = new GCV.visualization.Micro(
        this.el.nativeElement,
        this.colors,
        this.data,
        this.args
      );
      localStorage.setItem("viewer-micro-color-domain", this.colors.domain());
    }
  }
}
