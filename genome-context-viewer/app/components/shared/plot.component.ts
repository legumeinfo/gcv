// Angular
import { AfterViewInit,
         Component,
         ElementRef,
         Input,
         ViewChild } from '@angular/core';

// App
import { Group } from '../../models/group.model';

declare var plot;
declare var contextColors: any;
declare var d3: any;

@Component({
  moduleId: module.id,
  selector: 'plot',
  template: '<div #plot></div>',
  styles: [ '' ]
})

export class PlotComponent implements AfterViewInit {
  @Input() plot: Group;
  @Input() familySizes: any;

  @ViewChild('plot') el: ElementRef;

  ngAfterViewInit(): void {
    let id = 'plot-' + this.plot.id;
    this.el.nativeElement.id = id;
    plot(id, this.familySizes, contextColors, this.plot, {  // plot.js
      'geneClicked': (gene) => { },
      'plotClicked': (trackID) => { }
		});
  }
}
