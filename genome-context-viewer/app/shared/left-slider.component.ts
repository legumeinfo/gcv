import { animate, Component, Input, state, style, transition, trigger } from '@angular/core';

// TODO: move states and state transitions to UI
// TODO: move animation to generic animation for right/left sliders
class States
{
  static ACTIVE: string = 'active';
  static INACTIVE: string = 'inactive';   
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

export class LeftSliderComponent {
  private states = States;
  state = this.states.ACTIVE;
  
  hide(): void {
    this.state = this.states.INACTIVE;
  }
  
  show(): void {
    this.state = this.states.ACTIVE;
  }
}
