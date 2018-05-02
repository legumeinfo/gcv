// Angular
import { Component, AfterViewInit } from "@angular/core";
import * as $ from "jquery";
// App
import { AppConfig } from "../../app.config";

@Component({
  moduleId: module.id.toString(),
  selector: "header",
  styles: [ require("./header.component.scss") ],
  template: require("./header.component.html"),
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
