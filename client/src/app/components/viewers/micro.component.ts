// Angular + dependencies
import { Component } from "@angular/core";
import { GCV } from "../../../assets/js/gcv";
// App
import { Viewer } from "./viewer.component";

declare var universalMouseEvent: any;  // src/assets/js/utils

@Component({
  selector: "viewer-micro",
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
  `],
  templateUrl: "./viewer.component.html",
})
export class MicroViewerComponent extends Viewer {

  private broadcastChannel: BroadcastChannel;

  constructor() {
    super("Micro-Synteny");
    this.broadcastChannel = new BroadcastChannel("GCV");
    this.broadcastChannel.onmessage = (msgEvent) => this.onMessage(msgEvent.data);
  }

  draw(): void {
    if (this.el !== undefined && this.data !== undefined) {
      this.destroy();
      const colorDomainStr = localStorage.getItem("viewer-micro-color-domain");
      if (colorDomainStr != null) {
        this.colors.domain(colorDomainStr.split(","));
      }
      this.viewer = new GCV.visualization.Micro(
        this.el.nativeElement,
        this.colors,
        this.data,
        {
          nameOver: (track) => {
            this.broadcastChannel.postMessage({
              event: "mouseover",
              type: "chromosome",
              target: track.chromosome_name,
            });
          },
          nameOut: (track) => {
            this.broadcastChannel.postMessage({
              event: "mouseout",
              type: "chromosome",
              target: track.chromosome_name,
            });
          },
          geneOver: (g) => {
            this.broadcastChannel.postMessage({
              event: "mouseover",
              type: "gene",
              target: g.id,
            });
          },
          geneOut: (g) => {
            this.broadcastChannel.postMessage({
              event: "mouseout",
              type: "gene",
              target: g.id,
            });
          },
          ...this.args
        },
      );
      localStorage.setItem("viewer-micro-color-domain", this.colors.domain());
    }
  }

  private onMessage(msg) {
    let selector = "viewer-micro .GCV ";
    switch(msg.type) {
      case "chromosome":
        selector += ".tick text[data-chromosome=\"" + msg.target + "\"]";
        break;
      case "gene":
        selector += ".gene[data-gene=\"" + msg.target + "\"]";
        break;
    }
    universalMouseEvent(msg.event, selector);
  }
}
