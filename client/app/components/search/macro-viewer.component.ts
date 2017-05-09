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
import { ContextMenuComponent } from '../shared/context-menu.component';
import { DataSaver }            from '../../models/data-saver.model';
import { MacroTracks }          from '../../models/macro-tracks.model';

declare var d3: any;
declare var GCV: any;
declare var taxonChroma: any;

@Component({
  moduleId: module.id,
  selector: 'macro-viewer',
  template: `
    <spinner [data]="tracks"></spinner>
    <div #macroViewer>
      <context-menu #menu
        (saveData)="saveAsJSON(tracks)"
        (saveImage)="saveXMLasSVG(viewer.xml())" >
      </context-menu>
    </div>
  `,
  styles: [ 'div { position: relative; }' ]
})

export class MacroViewerComponent extends DataSaver
                                  implements AfterViewInit,
                                             OnChanges,
                                             OnDestroy {

  // inputs

  @Input() tracks: MacroTracks;
  private _args;
  @Input()
  set args(args: Object) {
    this._args = Object.assign({}, args);
  }

  // view children

  @ViewChild('macroViewer') el: ElementRef;
  @ViewChild('menu') contextMenu: ContextMenuComponent;

  viewer = undefined;

  // constructor

  constructor() {
    super('macro-synteny');
  }

  // Angular hooks

  ngAfterViewInit(): void {
    this._draw();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this._args.contextmenu = function (e, m) {
      this._showContextMenu(e, m);
    }.bind(this);
    this._args.click = function (e, m) {
      this._hideContextMenu(e, m);
    }.bind(this);
    this._args.colors = function (s) { return taxonChroma.get(s) };
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
    if (this.el !== undefined && this.tracks !== undefined) {
      this._destroy();
      this.viewer = new GCV.Synteny(
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
}
