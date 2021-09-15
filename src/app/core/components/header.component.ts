// Angular
import { Component, AfterViewInit } from '@angular/core';
import * as $ from 'jquery';
// App
import { AppConfig } from '@gcv/app.config';

@Component({
  selector: 'gcv-header',
  styleUrls: [ './header.component.scss' ],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements AfterViewInit {

  brand = AppConfig.BRAND;

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
