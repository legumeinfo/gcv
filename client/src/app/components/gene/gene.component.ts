// Angular
import { AfterViewInit, Component, OnDestroy, ViewChild } from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
// app
import { GoldenLayoutDirective } from "../../directives";
import { MicroTracksService } from "../../services";
import { MacroComponent } from "./macro.component";
import { MicroComponent } from "./micro.component";
import { PlotComponent } from "./plot.component";

@Component({
  selector: "gene",
  styleUrls: ["./gene.component.scss"],
  templateUrl: "./gene.component.html",
})
export class GeneComponent implements OnDestroy, AfterViewInit {

  @ViewChild(GoldenLayoutDirective) goldenLayoutDirective;

  private _destroy: Subject<boolean> = new Subject();

  layoutComponents = [
      {component: MacroComponent, name: "macro"},
      {component: MicroComponent, name: "micro"},
      {component: PlotComponent, name: "plot"}
    ];
  layoutConfig = {
      content: [{
        type: "column",
        content: []
      }]
    };

  constructor(private _microTracksService: MicroTracksService) { }

  // Angular hooks

  ngOnDestroy(): void {
    this._destroy.next(true);
    this._destroy.complete();
  }

  ngAfterViewInit(): void {
    this._microTracksService.clusterIDs
      .pipe(takeUntil(this._destroy))
      .subscribe((IDs) => {
        this._setLayoutConfig(IDs);
      });
  }

  // private

  private _setLayoutConfig(clusterIDs): void {
    const microConfig = (id) => {
      return  {
       type: "component",
        componentName: "micro",
        componentState: {
          inputs: {cluster: id},
          outputs: {
            plot: (() => {
              this.goldenLayoutDirective.addItem({type: "component", componentName: "plot"});
            })
          },
        },
        isClosable: false
      };
    };
    // TODO: remove existing components before adding new ones
    clusterIDs.forEach((id) => {
      this.goldenLayoutDirective.addItem(microConfig(id));
    });
  }

  // public
}
