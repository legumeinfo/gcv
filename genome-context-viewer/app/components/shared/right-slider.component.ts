// Angular
import { Component,
         Input,
         OnChanges,
         SimpleChanges } from '@angular/core';

// App
import { SLIDER_ACTIVE, SLIDER_INACTIVE } from '../../constants/toggle-slider';
import { toggleSlider }                   from '../../animations/toggle-slider.animation';

@Component({
  moduleId: module.id,
  selector: 'right-slider',
  template: `
    <div class="right-slider col-md-3" [@toggleSlider]='state'>
      <div class="table">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .right-slider {
      margin: 0;
      padding: 0;
      height: 100%;
      float: right;
      border-left: #E7E7E7 solid 1px;
    }
    .right-slider .table {
      width: 100%;
      height: 100%;
      display: table;
    }
    /* vertically stretch .vertical-fill to remaining area */
    :host /deep/ .row {
      display: table-row;
      width: 100%;
      margin: 0;
    }
    :host /deep/ .vertical-fill {
      height: 100%;
    }
  `],
  animations: [ toggleSlider ]
})

export class RightSliderComponent implements OnChanges {
  @Input() hide: boolean;

  state = SLIDER_ACTIVE;

  ngOnChanges(changes: SimpleChanges): void {
    if (this.hide) this.state = SLIDER_INACTIVE;
    else this.state = SLIDER_ACTIVE;
  }
}
