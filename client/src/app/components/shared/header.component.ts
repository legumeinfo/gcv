import { Component, OnInit } from "@angular/core";
import * as $ from "jquery";

@Component({
  moduleId: module.id.toString(),
  selector: "header",
  styles: [ require("./header.component.scss") ],
  template: require("./header.component.html"),
})
export class HeaderComponent implements OnInit {

  ngOnInit(): void {
    this.toggleBrand();
  }

  toggleBrand(): void {
    // TODO: replace with Angular animation
    $(".navbar-brand span").animate({width: "toggle"}, 150);
  }
}
