// Angular
import { Component, AfterViewInit } from '@angular/core';
import * as $ from 'jquery';
// App
import { AppConfig, Brand } from '@gcv/core/models';

@Component({
  selector: 'gcv-header',
  styleUrls: [ './header.component.scss' ],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements AfterViewInit {

  brand: Brand;

  constructor(private _appConfig: AppConfig) {
    this.brand = _appConfig.brand;
  }

  ngAfterViewInit(): void {
    this.toggleBrand();
  }

  toggleBrand(): void {
    if (this.brand.hide) {
      // TODO: replace with Angular animation or CSS transition
      $('.navbar-brand span, .navbar-brand div').animate({width: 'toggle'}, 150);
    }
  }
}
