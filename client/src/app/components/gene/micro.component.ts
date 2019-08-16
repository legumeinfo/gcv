// Angular + dependencies
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy,
  Output, ViewChild } from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
// app
import { GCV } from "../../../assets/js/gcv";
import { MicroTracksService } from "../../services";

@Component({
  selector: "micro",
  styles: [],
  template: `
    <div class="row no-gutters h-100 overflow-hidden">
      <div class="col-md-auto card-col-left border-right" gcvSidebar #macroParams="sidebar">
        parameters
      </div>
      <div class="col card-col">
        micro viewer: {{cluster}}
      </div>
      <div class="col-md-auto card-col-right border-left" gcvSidebar #macroLegend="sidebar">
        macro legend
      </div>
    </div>
  `,
})
export class MicroComponent implements AfterViewInit, OnDestroy {

  @Input() cluster: number;
  @Input() colors: any;  // D3 color function
  @Output() plot = new EventEmitter();

  @ViewChild("container") container: ElementRef;

  private _destroy: Subject<boolean> = new Subject();

  constructor(private _microTracksService: MicroTracksService) { }

  // Angular hooks

  ngAfterViewInit() {
    // fetch own data because injected components don't have change detection
    this._microTracksService.getCluster(this.cluster)
      .pipe(takeUntil(this._destroy))
      .subscribe(this._draw);
  }

  ngOnDestroy() {
    this._destroy.next(true);
    this._destroy.complete();
  }

  // public

  spawnPlot() {
    this.plot.emit();
  }

  // private

  _draw(): void {
    //const viewer = new GCV.visualization.Micro(this.container.nativeElement);
    //this.container.nativeElement.innerHTML = "micro-synteny viewer";
  }
}
