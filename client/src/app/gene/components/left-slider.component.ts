// Angular
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges }
  from '@angular/core';
// App
import { SliderStates, toggleSlider } from '@gcv/gene/animations';


@Component({
  animations: [ toggleSlider ],
  selector: 'left-slider',
  styleUrls: [ './left-slider.component.scss' ],
  templateUrl: './left-slider.component.html',
})
export class LeftSliderComponent implements OnChanges {

  @Input() open: boolean;
  @Output() onClose = new EventEmitter<any>();

  state = SliderStates.SLIDER_INACTIVE;

  // Angular hooks

  ngOnChanges(changes: SimpleChanges): void {
    if (this.open) {
      this.state = SliderStates.SLIDER_ACTIVE;
    } else {
      this.state = SliderStates.SLIDER_INACTIVE;
    }
  }

  // public

  close(): void {
    this.onClose.emit();
  }
}
