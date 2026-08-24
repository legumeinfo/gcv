// Angular
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
// App
import { SliderStates, toggleSlider } from '@gcv/gene/animations';
import { LayoutService } from '@gcv/gene/services';

@Component({
  animations: [toggleSlider],
  selector: 'gcv-left-slider',
  styleUrls: ['./left-slider.component.scss'],
  templateUrl: './left-slider.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class LeftSliderComponent {
  private _layoutService = inject(LayoutService);

  state: Observable<SliderStates>;
  content: Observable<string>;

  constructor() {
    const _layoutService = this._layoutService;

    this.state = _layoutService.getLeftSliderState().pipe(
      map((showSlider) => {
        if (showSlider) {
          return SliderStates.SLIDER_ACTIVE;
        }
        return SliderStates.SLIDER_INACTIVE;
      }),
    );
    this.content = _layoutService.selectLeftSliderContent();
  }

  // public

  close(): void {
    this._layoutService.closeLeftSlider();
  }

  open(): void {
    this._layoutService.openLeftSlider();
  }
}
