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
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .right-slider {
      margin: 0;
      padding: 0;
      height: 100%;
      float: right;
      border-left: #E7E7E7 solid 1px;
      display: -webkit-box; /* OLD - iOS 6-, Safari 3.1-6 */
      display: -moz-box; /* OLD - Firefox 19- (buggy but mostly works) */
      display: -ms-flexbox; /* TWEENER - IE 10 */
      display: -webkit-flex; /* NEW - Chrome */
      display: flex; /* NEW, Spec - Opera 12.1, Firefox 20+ */
      -ms-flex-direction: column;
      -moz-flex-direction: column;
      -webkit-flex-direction: column;
      flex-direction: column;
    }
    /* vertically stretch .vertical-fill to remaining area */
    :host /deep/ .vertical-fill {
      -webkit-box-flex: 1; /* OLD - iOS 6-, Safari 3.1-6 */
      -moz-box-flex: 1; /* OLD - Firefox 19- */
      -webkit-flex: 1; /* Chrome */
      -ms-flex: 1; /* IE 10 */
      flex: 1; /* NEW, */
      overflow: auto;
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
