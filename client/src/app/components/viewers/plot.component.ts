// Angular + dependencies
import { Component, Input, OnChanges, OnDestroy,
  SimpleChanges } from "@angular/core";
import { GCV } from "../../../assets/js/gcv";

// App
import { Viewer } from "./viewer.component";

@Component({
  moduleId: module.id.toString(),
  selector: "viewer-plot",
  styles: [`
    div {
      position: relative;
    }
    #overlay {
      position:absolute;
      left:0;
      right:0;
      z-index:1;
    }
  `],
  template: require("./viewer.component.html"),
})

export class PlotViewerComponent extends Viewer {

  @Input() visibleDraw: boolean;

  noContext = true;

  private drawnSinceChange: boolean;

  constructor() {
    super("Plot");
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.drawnSinceChange = false;
    super.ngOnChanges(changes);
  }

  draw(): void {
    if ((this.el !== undefined && this.data !== undefined) &&
    (!this.visibleDraw || (this.visibleDraw && this.visible())) &&
    !this.drawnSinceChange) {
      this.destroy();
      const colorDomainStr = localStorage.getItem("viewer-micro-color-domain");
      this.viewer = new GCV.visualization.Plot(
        this.el.nativeElement,
        this.colors,
        this.data,
        this.args,
      );
      this.drawnSinceChange = true;
      localStorage.setItem("viewer-micro-color-domain", this.colors.domain());
    }
  }

  private visible(): boolean {
    const rec = this.el.nativeElement.getBoundingClientRect();
    const vp = {width: window.innerWidth, height: window.innerHeight};
    const tViz = rec.top >= 0 && rec.top < vp.height;
    const bViz = rec.bottom > 0 && rec.bottom <= vp.height;
    const lViz = rec.left >= 0 && rec.left < vp.width;
    const rViz = rec.right > 0 && rec.right <= vp.width;
    const vVisible = tViz || bViz;
    const hVisible = lViz || rViz;
    if (vVisible && hVisible) {
      return true;
    }
    return false;
  }
}
