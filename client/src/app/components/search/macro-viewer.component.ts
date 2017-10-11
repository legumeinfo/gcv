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
import { DataSaver }   from '../../models/data-saver.model';
import { MacroTracks } from '../../models/macro-tracks.model';

declare var d3: any;
declare var GCV: any;

@Component({
  moduleId: module.id,
  selector: 'macro-viewer',
  template: `
    <spinner [data]="tracks"></spinner>
    <context-menu #menu
      [title]="'Macro-Synteny'"
      (saveData)="saveAsJSON(tracks)"
      (saveImage)="saveXMLasSVG(viewer.xml())" >
      <ng-content dropdown></ng-content>
    </context-menu>
    <div #macroViewer class="viewer"></div>
  `,
  styles: [`
    .viewer {
      position: absolute;
      top: 28px;
      right: 0;
      bottom: 0;
      left: 0;
      overflow-x: hidden;
      overflow-y: auto;
    }
  `]
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
}
