// Angular
import { Component, Output, SimpleChanges } from '@angular/core';
import { Observable } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
// App
import { SliderStates, toggleSlider } from '@gcv/gene/animations';
import { LayoutService } from '@gcv/gene/services';


@Component({
  animations: [ toggleSlider ],
  selector: 'gcv-left-slider',
  styleUrls: [ './left-slider.component.scss' ],
  templateUrl: './left-slider.component.html',
})
export class LeftSliderComponent {

  state: Observable<SliderStates>;
  content: Observable<string>;

  constructor(private _layoutService: LayoutService) {
    this.state = _layoutService.getLeftSliderState()
      .pipe(
        map((showSlider) =>  {
          if (showSlider) {
            return SliderStates.SLIDER_ACTIVE;
          }
          return SliderStates.SLIDER_INACTIVE;
        }),
      );
    this.content = _layoutService.getLeftSliderContent();
  }

  // public

  close(): void {
    this._layoutService.closeLeftSlider();
  }

  open(): void {
    this._layoutService.openLeftSlider();
  }
}
