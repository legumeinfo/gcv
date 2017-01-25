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
import { ContextMenuComponent } from './context-menu.component';
import { Group }                from '../../models/group.model';

declare var d3: any;
declare var GCV: any;

@Component({
  moduleId: module.id,
  selector: 'plot',
  template: `
    <spinner [data]="plot"></spinner>
    <div #plot>
      <context-menu #menu (saveImage)="saveImage()"></context-menu>
    </div>
  `,
  styles: [ 'div { position: relative; }' ]
})

export class PlotComponent implements AfterViewInit, OnChanges, OnDestroy {

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
  @ViewChild('menu') contextMenu: ContextMenuComponent;

  // variables

  private _plot = undefined;
  private _drawnSinceChange: boolean;

  // Angular hooks

  ngAfterViewInit(): void {
    this.draw();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this._args.contextmenu = function (e, m) {
      this._showContextMenu(e, m);
    }.bind(this);
    this._args.click = function (e, m) {
      this._hideContextMenu(e, m);
    }.bind(this);
    this._drawnSinceChange = false;
    this.draw();
  }

  ngOnDestroy(): void {
    this._destroy();
  }

  // private

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

  private _showContextMenu(e): void {
    e.preventDefault();
    this.contextMenu.show(e.layerX, e.layerY);
  }

  private _hideContextMenu(e): void {
    this.contextMenu.hide();
  }

  // public

  draw(): void {
    if ((this.el !== undefined && this.plot !== undefined) &&
    (!this.visibleDraw || (this.visibleDraw && this._visible())) &&
    !this._drawnSinceChange) {
      this._destroy();
      this._plot = new GCV.Plot(
        this.el.nativeElement,
        this.colors,
        this.plot,
        this._args
      );
      this._drawnSinceChange = true;
    }
  }

  saveData(): void { }

  saveImage(): void {
    if (this._plot !== undefined)
      this._plot.save();
  }
}
