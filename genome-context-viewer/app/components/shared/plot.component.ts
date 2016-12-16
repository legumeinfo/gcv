// Angular
import { AfterViewInit,
         Component,
         ElementRef,
         OnDestroy,
         Input,
         ViewChild } from '@angular/core';

// App
import { Group } from '../../models/group.model';

declare var GCV: any;
declare var plot;
declare var contextColors: any;
declare var d3: any;

@Component({
  moduleId: module.id,
  selector: 'plot',
  template: '<div #plot></div>',
  styles: [ '' ]
})

export class PlotComponent implements AfterViewInit, OnDestroy {
  @Input() plot: Group;
  @Input() familySizes: any;

  @ViewChild('plot') el: ElementRef;

  private _plot;

  ngAfterViewInit(): void {
    let id = 'plot-' + this.plot.id;
    this.el.nativeElement.id = id;
    //plot(id, this.familySizes, contextColors, this.plot, {  // plot.js
    //  'geneClicked': (gene) => { },
    //  'plotClicked': (trackID) => { }
		//});
    this._plot = new GCV.Plot(id, contextColors, this.plot, {
      'autoResize': true,
      'outlier': -1,
      'selectiveColoring': this.familySizes,
      'geneClick': (gene) => { },
      'plotClick': (trackID) => { }
		});
  }

  ngOnDestroy(): void {
    this._plot.destroy();
    this._plot = undefined;
  }
}
