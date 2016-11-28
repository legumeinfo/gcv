import { Component } from '@angular/core';

@Component({
  moduleId: module.id,
  selector: 'spinner',
  template: `
    <div class="grey-screen">
      <div class="spinner">
        <img src="img/spinner.gif" />
      </div>
    </div>
  `,
  styles: [ '' ]
})

export class SpinnerComponent {
  // constructor should take in selectedFamily
}
