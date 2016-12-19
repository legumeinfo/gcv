// Angular
import { AfterViewInit,
         Component,
         ElementRef,
         Input,
         OnChanges,
         SimpleChanges,
         ViewChild }  from '@angular/core';
import { Observable } from 'rxjs/Observable';

// App store
import { MicroTracks } from '../../models/micro-tracks.model';

declare var contextColors: any;
declare var d3: any;
declare var GCV: any;

@Component({
  moduleId: module.id,
  selector: 'micro-viewer',
  template: '<div #microViewer></div>',
  styles: [ '' ]
})

export class MicroViewerComponent implements AfterViewInit, OnChanges {
  @Input() tracks: MicroTracks;
  @Input() args: any;

  @ViewChild('microViewer') el: ElementRef;

  private _viewer = undefined;
  private _id = 'micro-tracks';  // dynamically set to UUID in ngOnInit

  ngOnChanges(changes: SimpleChanges): void {
    this._draw();
  }

  ngAfterViewInit(): void {
    this.el.nativeElement.id = this._id;
    this._draw();
  }

  private _draw(): void {
    if (this.el !== undefined && this.el.nativeElement.id !== '') {
      if (this._viewer !== undefined) {
        this._viewer.destroy();
        this._viewer = undefined;
      }
      this._viewer = new GCV.Viewer(
        this._id,
        contextColors,
        this.tracks,
        this.args
      );
    }
  }
}
