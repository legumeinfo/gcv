// Angular
import { animate,
         Component,
         Input,
         OnChanges,
         SimpleChanges,
         state,
         style,
         transition,
         trigger } from '@angular/core';

// App
import { Family }      from '../../models/family.model';
import { Gene }        from '../../models/gene.model';
import { Group }       from '../../models/group.model';
import { MicroTracks } from '../../models/micro-tracks.model';

// TODO: move states and state transitions to UI
// TODO: move animation to generic animation for right/left sliders
class States
{
  static ACTIVE: string = 'active';
  static INACTIVE: string = 'inactive';   
}

enum DetailTypes {
  PARAMS,
  GENE,
  FAMILY,
  TRACK
}

@Component({
  moduleId: module.id,
  selector: 'left-slider',
  templateUrl: 'left-slider.component.html',
  styleUrls: [ 'left-slider.component.css' ],
  animations: [
    trigger('toggleState', [
      state(States.ACTIVE, style({transform: 'translateX(0%)'})),
      state(States.INACTIVE, style({transform: 'translateX(-100%)'})),
      transition(
        States.INACTIVE + ' => ' + States.ACTIVE,
        animate('100ms ease-in')
      ),
      transition(
        States.ACTIVE + ' => ' + States.INACTIVE,
        animate('100ms ease-out')
      )
    ])
  ]
})

export class LeftSliderComponent implements OnChanges {
  @Input() selected: Family | Gene | Group;
  @Input() tracks: MicroTracks;

  private states = States;
  state = this.states.ACTIVE;

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
    } else {
      if (this.selectedDetail == DetailTypes.PARAMS &&
      this.state == this.states.ACTIVE) {
        this.hide();
      } else {
        this.selectedDetail = DetailTypes.PARAMS;
        this.show();
      }
    }
  }
  
  hide(): void {
    this.state = this.states.INACTIVE;
  }
  
  show(): void {
    this.state = this.states.ACTIVE;
  }
}
