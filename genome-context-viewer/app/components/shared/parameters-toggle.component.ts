import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  moduleId: module.id,
  selector: 'parameters-toggle',
  template: '<button type="button" class="btn btn-default navbar-btn" (click)="toggle()">Parameters</button>',
  styles: [ '' ]
})

export class ParametersToggleComponent {
  @Output() toggleFn = new EventEmitter();

  toggle(): void {
    this.toggleFn.emit();
  }
}
