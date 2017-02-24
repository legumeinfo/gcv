import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  moduleId: module.id,
  selector: 'toggle-button',
  template: '<button type="button" class="btn btn-default navbar-btn" (click)="toggle()"><ng-content></ng-content></button>',
  styles: [ '' ]
})

export class ToggleButtonComponent {
  @Output() toggleFn = new EventEmitter();

  toggle(): void {
    this.toggleFn.emit();
  }
}
