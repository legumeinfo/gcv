// Angular + dependencies
import { AfterViewInit, Component, ElementRef, EventEmitter, OnDestroy, Output,
  ViewChild } from "@angular/core";
import { GCV } from "../../../assets/js/gcv";

@Component({
  selector: "micro",
  styles: [],
  template: `
    <div #container>
    micro-synteny viewer
    <a class="btn btn-primary" (click)="spawnPlot()">Plot</a>
    </div>
  `,
})
export class MicroComponent implements AfterViewInit, OnDestroy {

  @Output() plot = new EventEmitter();

  @ViewChild("container") container: ElementRef;

  ngAfterViewInit() {
    //const viewer = new GCV.visualization.Micro(this.container.nativeElement);
    //this.container.nativeElement.innerHTML = "micro-synteny viewer";
  }

  ngOnDestroy() {
    //console.log('destroyed');
  }

  spawnPlot() {
    this.plot.emit();
  }
}
