// Angular + dependencies
import { AfterViewInit, Component, ElementRef, EventEmitter, OnDestroy, Output,
  ViewChild } from "@angular/core";
import { GCV } from "../../../assets/js/gcv";

@Component({
  selector: "micro",
  styles: [],
  template: `
    <div class="row no-gutters h-100 overflow-hidden">
      <div class="col-md-auto card-col-left border-right" gcvSidebar #macroParams="sidebar">
        parameters
      </div>
      <div class="col card-col">
        micro viewer
      </div>
      <div class="col-md-auto card-col-right border-left" gcvSidebar #macroLegend="sidebar">
        macro legend
      </div>
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
