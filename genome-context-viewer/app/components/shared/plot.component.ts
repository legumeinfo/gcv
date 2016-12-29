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
  template: '<spinner [data]="plot"></spinner><div #plot></div>',
  styles: [ '' ]
})

export class PlotComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() plot: Group;
  @Input() colors: any;
  @Input() args: any;
  @Input() visibleDraw: boolean;

  @ViewChild('plot') el: ElementRef;

  private _plot = undefined;
  private _drawnSinceChange: boolean;

  ngAfterViewInit(): void {
    this.draw();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this._drawnSinceChange = false;
    this.draw();
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

  private _visible(): boolean {
    const rec = this.el.nativeElement.getBoundingClientRect();
    const vp = {width: window.innerWidth, height: window.innerHeight};
    const tViz = rec.top >= 0 && rec.top < vp.height;
    const bViz = rec.bottom > 0 && rec.bottom <= vp.height;
    const lViz = rec.left >= 0 && rec.left < vp.width;
    const rViz = rec.right > 0 && rec.right <= vp.width;
    const vVisible = tViz || bViz;
    const hVisible = lViz || rViz;
		if (vVisible && hVisible) return true;
    return false;
  }

  draw(): void {
    if ((this.el !== undefined && this.plot !== undefined) &&
    (!this.visibleDraw || (this.visibleDraw && this._visible())) &&
    !this._drawnSinceChange) {
      this._destroy();
      this._plot = new GCV.Plot(
        this.el.nativeElement,
        this.colors,
        this.plot,
        this.args
      );
      this._drawnSinceChange = true;
    }
  }
}
