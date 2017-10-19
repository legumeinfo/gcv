// Angular + dependencies
import { AfterViewInit,
         Component,
         ElementRef,
         Input,
         OnChanges,
         OnDestroy,
         SimpleChanges,
         ViewChild } from '@angular/core';
import * as d3       from 'd3';
import { GCV }       from '../../../assets/js/gcv';

// App
import { DataSaver } from '../../models/data-saver.model';
import { Group }     from '../../models/group.model';

@Component({
  moduleId: module.id.toString(),
  selector: 'plot',
  template: `
    <spinner [data]="plot"></spinner>
    <div #plot></div>
  `,
  styles: [ 'div { position: relative; }' ]
})

export class PlotComponent extends DataSaver
                           implements AfterViewInit,
                                      OnChanges,
                                      OnDestroy {

  // inputs

  @Input() plot: Group;
  @Input() colors: any;
  private _args;
  @Input()
  set args(args: Object) {
    this._args = Object.assign({}, args);
  }
  @Input() visibleDraw: boolean;

  // view children

  @ViewChild('plot') el: ElementRef;

  // variables

  viewer = undefined;
  private _drawnSinceChange: boolean;

  // constructor

  constructor() {
    super('plot');
  }

  // Angular hooks

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

  // private

  private _destroy(): void {
    if (this.viewer !== undefined) {
      this.viewer.destroy();
      this.viewer = undefined;
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

  // public

  draw(): void {
    if ((this.el !== undefined && this.plot !== undefined) &&
    (!this.visibleDraw || (this.visibleDraw && this._visible())) &&
    !this._drawnSinceChange) {
      this._destroy();
      this.viewer = new GCV.visualization.Plot(
        this.el.nativeElement,
        this.colors,
        this.plot,
        this._args
      );
      this._drawnSinceChange = true;
    }
  }
}
