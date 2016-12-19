// Angular
import { AfterViewInit,
         Component,
         ElementRef,
         Input,
         SimpleChanges,
         ViewChild } from '@angular/core';

// App
import { MicroTracks } from '../../models/micro-tracks.model';

declare var GCV: any;
declare var contextLegend: any;
declare var contextColors: any;
declare var d3: any;

@Component({
  moduleId: module.id,
  selector: 'app-legend',
  template: `
    <div class="legend-wrapper">
      <div class=vertical-scroll>
        <div class="legend" #legend></div>
      </div>
    </div>
  `,
  styles: [`
    .legend-wrapper {
      overflow: hidden;
    }
    .legend-wrapper .vertical-scroll {
      position: relative;
      height: 100%
    }
    .legend-wrapper .vertical-scroll #legend {
      overflow-y: scroll;
      position: absolute;
      top: 0;
      right:0;
      bottom: 0;
      left: 0;
    }
  `]
})

export class LegendComponent implements AfterViewInit {
  @Input() microTracks: MicroTracks;
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
      //if (this._legend !== undefined) {
      //  this._legend.destroy();
      //  this._legend = undefined;
      //}
      contextLegend('legend-content', contextColors, this.microTracks, this.args);
    }
  }
}
