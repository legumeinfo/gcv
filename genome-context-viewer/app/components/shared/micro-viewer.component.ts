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
import { MicroTracks } from '../../models/micro-tracks.model';

declare var d3: any;
declare var GCV: any;

@Component({
  moduleId: module.id,
  selector: 'micro-viewer',
  template: '<div #microViewer></div>',
  styles: [ '' ]
})

export class MicroViewerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() tracks: MicroTracks;
  @Input() colors: any;
  @Input() args: any;

  @ViewChild('microViewer') el: ElementRef;

  private _viewer = undefined;
  private _id = 'micro-tracks';  // TODO: dynamically set to UUID in ngOnInit

  ngAfterViewInit(): void {
    this.el.nativeElement.id = this._id;
    this._draw();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this._draw();
  }

  ngOnDestroy(): void {
    this._destroy();
  }

  private _destroy(): void {
    if (this._viewer !== undefined) {
      this._viewer.destroy();
      this._viewer = undefined;
    }
  }

  private _draw(): void {
    if (this.el !== undefined && this.el.nativeElement.id !== '') {
      this._destroy();
      this._viewer = new GCV.Viewer(
        this._id,
        this.colors,
        this.tracks,
        this.args
      );
    }
  }
}
