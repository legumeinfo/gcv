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
import { DataSaver } from '../../models/data-saver.model';

declare var d3: any;
declare var GCV: any;

@Component({
  moduleId: module.id,
  selector: 'app-legend',
  template: `
    <spinner [data]="data"></spinner>
    <context-menu #menu
      title="{{title}}"
      (saveData)="saveAsJSON(tracks)"
      (saveImage)="saveXMLasSVG(viewer.xml())" >
    </context-menu>
    <div #legend class="viewer"></div>
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

export class LegendComponent extends DataSaver
                             implements AfterViewInit,
                                        OnChanges,
                                        OnDestroy {

  // inputs

  @Input() title: string;
  @Input() data: any;  // a list of objects with name and id attributes
  @Input() colors: any;
  private _args;
  @Input()
  set args(args: Object) {
    this._args = Object.assign({}, args);
  }

  // view children

  @ViewChild('legend') el: ElementRef;

  // variables

  viewer = undefined;

  // constructor

  constructor() {
    super('legend');
  }

  // Angular hooks

  ngOnChanges(changes: SimpleChanges): void {
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
    if (this.el !== undefined && this.data !== undefined) {
      if (this.viewer !== undefined) {
        this.viewer.destroy();
        this.viewer = undefined;
      }
      this.viewer = new GCV.Legend(
        this.el.nativeElement,
        this.colors,
        this.data,
        this._args
      );
    }
  }
}
