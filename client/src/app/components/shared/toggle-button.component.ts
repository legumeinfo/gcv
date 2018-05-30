import { Component, EventEmitter, Output } from "@angular/core";

@Component({
  selector: "toggle-button",
  styles: [ "" ],
  template: `
    <button type='button' class='btn btn-default navbar-btn' (click)='toggle()'>
      <ng-content></ng-content>
    </button>
  `,
})
export class ToggleButtonComponent {
  @Output() toggleFn = new EventEmitter();

  toggle(): void {
    this.toggleFn.emit();
  }
}
