// Angular
import { AfterViewInit,
         Component,
         ElementRef,
         Input,
         OnChanges,
         OnDestroy,
         SimpleChanges,
         ViewChild } from '@angular/core';

// App
import { ContextMenuComponent } from './context-menu.component';
import { DataSaver }            from '../../models/data-saver.model';
import { MicroTracks }          from '../../models/micro-tracks.model';

declare var d3: any;
declare var GCV: any;

@Component({
  moduleId: module.id,
  selector: 'app-legend',
  template: `
    <spinner [data]="microTracks"></spinner>
    <div #legend>
      <context-menu #menu
        (saveImage)="saveXMLasSVG(viewer.xml())" >
      </context-menu>
    </div>
  `,
  styles: [ '' ]
})

export class LegendComponent extends DataSaver
                             implements AfterViewInit,
                                        OnChanges,
                                        OnDestroy {

  // inputs

  @Input() microTracks: MicroTracks;
  @Input() colors: any;
  private _args;
  @Input()
  set args(args: Object) {
    this._args = Object.assign({}, args);
  }

  // view children

  @ViewChild('legend') el: ElementRef;
  @ViewChild('menu') contextMenu: ContextMenuComponent;

  // variables

  viewer = undefined;

  // constructor

  constructor() {
    super('legend');
  }

  // Angular hooks

  ngOnChanges(changes: SimpleChanges): void {
    this._args.contextmenu = function (e, m) {
      this._showContextMenu(e, m);
    }.bind(this);
    this._args.click = function (e, m) {
      this._hideContextMenu(e, m);
    }.bind(this);
    this._draw();
  }

  ngAfterViewInit(): void {
    this._draw();
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

  private _draw(): void {
    if (this.el !== undefined && this.microTracks !== undefined) {
      if (this.viewer !== undefined) {
        this.viewer.destroy();
        this.viewer = undefined;
      }
      this.viewer = new GCV.Legend(
        this.el.nativeElement,
        this.colors,
        this.microTracks,
        this._args
      );
    }
  }

  private _showContextMenu(e): void {
    e.preventDefault();
    this.contextMenu.show(e.layerX, e.layerY);
  }

  private _hideContextMenu(e): void {
    this.contextMenu.hide();
  }
}
