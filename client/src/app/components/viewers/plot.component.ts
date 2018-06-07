// Angular + dependencies
import { Component, Input, OnChanges, OnDestroy,
  SimpleChanges } from "@angular/core";
import { GCV } from "../../../assets/js/gcv";
// App
import { elementIsVisible } from "../../utils";
import { Viewer } from "./viewer.component";

@Component({
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
  templateUrl: "./viewer.component.html",
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
    (!this.visibleDraw || (this.visibleDraw && elementIsVisible(this.el.nativeElement))) &&
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
}
