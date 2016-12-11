// Angular
import { AfterViewInit, Component, Input } from '@angular/core';
import { Observable }                      from 'rxjs/Observable';

// App store
import { MicroTracks } from '../../models/micro-tracks.model';

declare var contextColors: any;
declare var d3: any;
declare var GCV: any;

@Component({
  moduleId: module.id,
  selector: 'micro-viewer',
  template: '<div id="micro-viewer"></div>',
  styles: [ '' ]
})

export class MicroViewerComponent implements AfterViewInit {
  @Input() tracks: Observable<MicroTracks>;
  @Input() args: Observable<Array<string>>;

  private _viewer = undefined;

  private _draw(tracks: MicroTracks): void {
    if (this._viewer !== undefined) this._viewer.destroy();
    this._viewer = new GCV.Viewer(
      'micro-viewer',
      contextColors,
      tracks,
      this.args
    );
  }

  ngAfterViewInit(): void {
    this.tracks.subscribe(tracks => {
      this._draw(tracks);
    });
  }
}
