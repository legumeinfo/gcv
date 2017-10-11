// Angular
import { AfterViewInit,
         Component,
         ElementRef,
         Input,
         OnChanges,
         OnDestroy,
         SimpleChanges,
         ViewChild }  from '@angular/core';
import { Observable } from 'rxjs/Observable';

// App
import { DataSaver }   from '../../models/data-saver.model';
import { MicroTracks } from '../../models/micro-tracks.model';

declare var d3: any;
declare var GCV: any;

@Component({
  moduleId: module.id,
  selector: 'micro-viewer',
  template: `
    <spinner [data]="tracks"></spinner>
    <context-menu #menu
      [title]="'Micro-Synteny'"
      (saveData)="saveAsJSON(tracks)"
      (saveImage)="saveXMLasSVG(viewer.xml())" >
      <ng-content navbar></ng-content>
    </context-menu>
    <div #microViewer class="viewer"></div>
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

export class MicroViewerComponent extends DataSaver
                                  implements AfterViewInit,
                                             OnChanges,
                                             OnDestroy {

  // inputs

  @Input() tracks: MicroTracks;
  @Input() colors: any;
  private _args;
  @Input()
  set args(args: Object) {
    this._args = Object.assign({}, args);
  }

  // view children

  @ViewChild('microViewer') el: ElementRef;

  // variables

  viewer = undefined;

  // constructor

  constructor() {
    super('micro-synteny');
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
      this.viewer = new GCV.Viewer(
        this.el.nativeElement,
        this.colors,
        this.tracks,
        this._args
      );
    }
  }
}
