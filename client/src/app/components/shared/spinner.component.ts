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
  styles: [`
    .grey-screen {
      z-index: 100000000 !important;
    }
  `]  // uses app level css
})

export class SpinnerComponent {
  @Input() data: any;
}
