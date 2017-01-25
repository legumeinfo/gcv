// Angular
import { AfterViewInit,
         Component,
         ElementRef,
         Input,
         OnChanges,
         SimpleChanges,
         ViewChild } from '@angular/core';

// App
import { ContextMenuComponent } from '../shared/context-menu.component';
import { MacroTracks }          from '../../models/macro-tracks.model';

declare var d3: any;
declare var GCV: any;

@Component({
  moduleId: module.id,
  selector: 'macro-viewer',
  template: `
    <spinner [data]="tracks"></spinner><div #macroViewer>
      <context-menu #menu (saveImage)="saveImage()"></context-menu>
    </div>
  `,
  styles: [ 'div { position: relative; }' ]
})

export class MacroViewerComponent implements AfterViewInit, OnChanges {
  @Input() tracks: MacroTracks;
  private _args;
  @Input()
  set args(args: Object) {
    this._args = Object.assign({}, args);
  }

  @ViewChild('macroViewer') el: ElementRef;
  @ViewChild('menu') contextMenu: ContextMenuComponent;

  private _viewer = undefined;

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

  private _draw(): void {
    if (this.el !== undefined && this.tracks !== undefined) {
      if (this._viewer !== undefined) {
        this._viewer.destroy();
        this._viewer = undefined;
      }
      this._viewer = new GCV.Synteny(
        this.el.nativeElement,
        this.tracks,
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

  saveData(): void { }

  saveImage(): void {
    if (this._viewer !== undefined)
      this._viewer.save();
  }
}
