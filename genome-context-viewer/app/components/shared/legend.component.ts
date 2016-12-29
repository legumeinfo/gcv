// Angular
import { AfterViewInit,
         Component,
         ElementRef,
         Input,
         SimpleChanges,
         ViewChild } from '@angular/core';

// App
import { MicroTracks } from '../../models/micro-tracks.model';

declare var d3: any;
declare var GCV: any;

@Component({
  moduleId: module.id,
  selector: 'app-legend',
  template: '<spinner [data]="microTracks"></spinner><div #legend></div>',
  styles: [ '' ]
})

export class LegendComponent implements AfterViewInit {
  @Input() microTracks: MicroTracks;
  @Input() colors: any;
  @Input() args: any;

  @ViewChild('legend') el: ElementRef;

  private _legend = undefined;

  ngOnChanges(changes: SimpleChanges): void {
    this._draw();
  }

  ngAfterViewInit(): void {
    this._draw();
  }

  private _draw(): void {
    if (this.el !== undefined && this.microTracks !== undefined) {
      if (this._legend !== undefined) {
        this._legend.destroy();
        this._legend = undefined;
      }
      this._legend = new GCV.Legend(
        this.el.nativeElement,
        this.colors,
        this.microTracks,
        this.args
      );
    }
  }
}
