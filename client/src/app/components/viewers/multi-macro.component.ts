// Angular
import { Component } from "@angular/core";
import { GCV } from "../../../assets/js/gcv";
// app
import { Viewer } from "./viewer.component";

@Component({
  selector: "viewer-multi-macro",
  styles: [`
    .viewer {
      position: absolute;
      top: 28px;
      right: 0;
      bottom: 0;
      left: 0;
      overflow: hidden;
    }
  `],
  templateUrl: "./viewer.component.html",
})
export class MultiMacroViewerComponent extends Viewer {

  constructor() {
    super("Macro-Synteny");
  }

  draw(): void {
    if (this.el !== undefined && this.data !== undefined) {
      this.destroy();
      this.viewer = new GCV.visualization.MultiMacro(
        this.el.nativeElement,
        this.data,
        this.args,
      );
    }
  }
}
