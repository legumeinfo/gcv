// Angular
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
// app
import { AppConfig, Brand, Dashboard } from '@gcv/core/models';


@Component({
    selector: 'gcv-instructions',
    styleUrls: ['./instructions.component.scss'],
    templateUrl: './instructions.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class InstructionsComponent {
  private _appConfig = inject(AppConfig);


  brand: Brand;
  dashboard: Dashboard;
  copyrightYear = (new Date()).getFullYear();

  constructor() {
    const _appConfig = this._appConfig;

    this.brand = _appConfig.brand;
    this.dashboard = _appConfig.dashboard;
  }

  scrollTo(event): void {
    event.preventDefault();
    const selector = event.target.hash;
    const element = document.querySelector(selector);
    if (element != null) {
      const options = {behavior: "smooth", block: "start", inline: "nearest"};
      element.scrollIntoView(options);
    }
  }

}
