// Angular
import { AfterViewInit,
         Component,
         ElementRef,
         Input,
         OnChanges,
         SimpleChanges,
         ViewChild } from '@angular/core';

// App
import { MacroTracks } from '../../models/macro-tracks.model';

declare var d3: any;
declare var GCV: any;

@Component({
  moduleId: module.id,
  selector: 'macro-viewer',
  template: '<spinner [data]="tracks"></spinner><div #macroViewer></div>',
  styles: [ '' ]
})

export class MacroViewerComponent implements AfterViewInit, OnChanges {
  @Input() tracks: MacroTracks;
  @Input() args: any;

  @ViewChild('macroViewer') el: ElementRef;

  private _viewer = undefined;

  ngOnChanges(changes: SimpleChanges): void {
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
        this.args
      );
    }
  }
}
