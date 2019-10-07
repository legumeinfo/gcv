// Angular
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges }
  from '@angular/core';
// App
import { toggleSlider } from '@gcv/gene/animations';
import { SliderStates } from '@gcv/gene/constants';
import { Family, Gene, Group, MicroTracks, isFamily, isGene, isGroup }
  from '@gcv/gene/models';

enum DetailTypes {
  PARAMS,
  GENE,
  FAMILY,
  TRACK,
}

@Component({
  animations: [ toggleSlider ],
  selector: 'left-slider',
  styleUrls: [ './left-slider.component.scss' ],
  templateUrl: './left-slider.component.html',
})
export class LeftSliderComponent implements OnChanges {
  @Input() selected: Family | Gene | Group | object;
  @Input() tracks: MicroTracks;
  @Output() onClose = new EventEmitter<any>();

  state = SliderStates.SLIDER_ACTIVE;

  detailTypes = DetailTypes;
  selectedDetail;

  family;
  gene;
  track;

  ngOnChanges(changes: SimpleChanges): void {
    if (isFamily(this.selected)) {
      this.selectedDetail = DetailTypes.FAMILY;
      this.family = this.selected;
      this.show();
    } else if (isGene(this.selected)) {
      this.selectedDetail = DetailTypes.GENE;
      this.gene = this.selected;
      this.show();
    } else if (isGroup(this.selected)) {
      this.selectedDetail = DetailTypes.TRACK;
      this.track = this.selected;
      this.show();
    } else if (this.selected instanceof Object) {
      if (this.selectedDetail === DetailTypes.PARAMS &&
      this.state === SliderStates.SLIDER_ACTIVE) {
        this.hide();
      } else {
        this.selectedDetail = DetailTypes.PARAMS;
        this.show();
      }
    } else {
      this.hide();
    }
  }

  // public methods

  close(): void {
    this.onClose.emit();
  }

  // private methods

  private hide(): void {
    this.state = SliderStates.SLIDER_INACTIVE;
  }

  private show(): void {
    this.state = SliderStates.SLIDER_ACTIVE;
  }
}
