import { Component, Input } from '@angular/core';

@Component({
  moduleId: module.id,
  selector: 'spinner',
  template: `
    <div class="grey-screen" *ngIf="!data">
      <div class="spinner">
        <img src="assets/img/spinner.gif" />
      </div>
    </div>
  `,
  styles: [ '' ]  // uses app level css
})

export class SpinnerComponent {
  @Input() data: any;
}
