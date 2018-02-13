// Angular
import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";

// App
import { toggleSlider } from "../../animations/toggle-slider.animation";
import { SliderStates } from "../../constants/slider-states";
import { Family } from "../../models/family.model";
import { Gene } from "../../models/gene.model";
import { Group } from "../../models/group.model";
import { MicroTracks } from "../../models/micro-tracks.model";

enum DetailTypes {
  PARAMS,
  GENE,
  FAMILY,
  TRACK,
}

@Component({
  animations: [ toggleSlider ],
  moduleId: module.id.toString(),
  selector: "left-slider",
  styles: [ require("./left-slider.component.scss") ],
  template: require("./left-slider.component.html"),
})
export class LeftSliderComponent implements OnChanges {
  @Input() selected: Family | Gene | Group | object;
  @Input() tracks: MicroTracks;

  state = SliderStates.SLIDER_ACTIVE;

  detailTypes = DetailTypes;
  selectedDetail;

  family;
  gene;
  track;

  ngOnChanges(changes: SimpleChanges): void {
    if (this.selected instanceof Family) {
      this.selectedDetail = DetailTypes.FAMILY;
      this.family = this.selected;
      this.show();
    } else if (this.selected instanceof Gene) {
      this.selectedDetail = DetailTypes.GENE;
      this.gene = this.selected;
      this.show();
    } else if (this.selected instanceof Group) {
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

  hide(): void {
    this.state = SliderStates.SLIDER_INACTIVE;
  }

  show(): void {
    this.state = SliderStates.SLIDER_ACTIVE;
  }
}
