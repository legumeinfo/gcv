// Angular
import { AfterViewInit, Component, OnDestroy, Input } from '@angular/core';
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

export class MicroViewerComponent implements AfterViewInit, OnDestroy {
  @Input() tracks: Observable<MicroTracks>;
  @Input() args: Observable<Array<string>>;

  private _viewer = undefined;
  private _sub;

  private _draw(tracks: MicroTracks): void {
    this._destroy();
    this._viewer = new GCV.Viewer(
      'micro-viewer',
      contextColors,
      tracks,
      this.args
    );
  }

  ngAfterViewInit(): void {
    this.sub = this.tracks.subscribe(tracks => {
      this._draw(tracks);
    });
  }

  ngOnDestroy(): void {
    this._destroy();
    this.sub.unsubscribe();
  }

  private _destroy(): void {
    if (this._viewer !== undefined) {
      this._viewer.destroy();
      this._viewer = undefined;
    }
  }
}
