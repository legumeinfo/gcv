// Angular
import { AfterViewInit,
         Component,
         ElementRef,
         Input,
         OnChanges,
         SimpleChanges,
         OnDestroy,
         ViewChild } from '@angular/core';

// App
import { Group } from '../../models/group.model';

declare var d3: any;
declare var GCV: any;

@Component({
  moduleId: module.id,
  selector: 'plot',
  template: '<div #plot></div>',
  styles: [ '' ]
})

export class PlotComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() plot: Group;
  @Input() colors: any;
  @Input() args: any;

  @ViewChild('plot') el: ElementRef;

  private _plot = undefined;

  ngAfterViewInit(): void {
    this._draw();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this._draw();
  }

  ngOnDestroy(): void {
    this._destroy();
  }

  private _destroy(): void {
    if (this._plot !== undefined) {
      this._plot.destroy();
      this._plot = undefined;
    }
  }

  private _draw(): void {
    if (this.el !== undefined && this.plot !== undefined) {
      this._destroy();
      this._plot = new GCV.Plot(
        this.el.nativeElement,
        this.colors,
        this.plot,
        this.args
      );
    }
  }
}
