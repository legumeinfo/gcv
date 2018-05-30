// Angular
import { Component, AfterViewInit } from "@angular/core";
import * as $ from "jquery";
// App
import { AppConfig } from "../../app.config";

@Component({
  selector: "header",
  styleUrls: [ "./header.component.scss" ],
  templateUrl: "./header.component.html",
})
export class HeaderComponent implements AfterViewInit {

  brand = AppConfig.BRAND;

  ngAfterViewInit(): void {
    this.toggleBrand();
  }

  toggleBrand(): void {
    // TODO: replace with Angular animation
    $(".navbar-brand span").animate({width: "toggle"}, 150);
  }
}
