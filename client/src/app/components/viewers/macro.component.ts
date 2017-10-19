// Angular + dependencies
import { Component } from '@angular/core';
import { GCV }       from '../../../assets/js/gcv';

// App
import { Viewer }      from './viewer.component';

@Component({
  moduleId: module.id.toString(),
  selector: 'viewer-macro',
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

export class MacroViewerComponent extends Viewer {

  constructor() {
    super('Macro-Synteny');
  }

  draw(): void {
    if (this.el !== undefined && this.data !== undefined) {
      this.destroy();
      this.viewer = new GCV.visualization.Macro(
        this.el.nativeElement,
        this.data,
        this.args
      );
    }
  }
}
