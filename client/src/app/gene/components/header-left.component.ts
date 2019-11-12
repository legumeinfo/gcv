// Angular
import { Component } from '@angular/core';
// app
import { LayoutService } from '@gcv/gene/services';


@Component({
  selector: 'header-left',
  styles: [`
    a {
      cursor: pointer;
    }
    .btn-outline-dark:hover {
      color: #fff !important;
    }
  `],
  template: `
    <a class="btn btn-outline-dark" role="button" (click)="toggleSlider()">Parameters</a>
  `,
})
export class HeaderLeftComponent {

  constructor(private _layoutService: LayoutService) { }

  // public

  toggleSlider(): void {
    this._layoutService.toggleLeftSlider();
  }

}
