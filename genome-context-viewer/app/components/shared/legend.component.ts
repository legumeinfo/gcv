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
  template: `<div #legend></div>
  `,
  styles: [`
    div {
      position: relative;
      height: 100%;
      overflow-x: hidden;
      overflow-y: scroll;
    }
  `]
})

export class LegendComponent implements AfterViewInit {
  @Input() microTracks: MicroTracks;
  @Input() colors: any;
  @Input() args: any;

  @ViewChild('legend') el: ElementRef;

  private _legend = undefined;
  private _id = 'legend-content';  // dynamically set to UUID in ngOnInit

  ngOnChanges(changes: SimpleChanges): void {
    this._draw();
  }

  ngAfterViewInit(): void {
    this.el.nativeElement.id = this._id;  // dynamically set to UUID in ngOnInit
    this._draw();
  }

  private _draw(): void {
    if (this.el !== undefined && this.el.nativeElement.id !== '') {
      if (this._legend !== undefined) {
        this._legend.destroy();
        this._legend = undefined;
      }
      this._legend = new GCV.Legend(
        'legend-content',
        this.colors,
        this.microTracks,
        this.args
      );
    }
  }
}
