// Angular + dependencies
import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import * as $ from "jquery";

// App
import { Alert } from "../../models/alert.model";
import { AlertsService } from "../../services/alerts.service";

@Component({
  moduleId: module.id.toString(),
  selector: "header",
  styles: [ require("./header.component.scss") ],
  template: require("./header.component.html"),
})
export class HeaderComponent implements OnDestroy, OnInit {
  @Input() alerts: boolean = true;

  alert: Alert;

  private sub;

  constructor(private alertsService: AlertsService) { }

  ngOnDestroy(): void {
    // noop
  }

  ngOnInit(): void {
    this.sub = this.alertsService.alerts.subscribe((alert) => this.alert = alert);
    this.toggleBrand();
  }

  toggleBrand(): void {
    $(".navbar-brand span").animate({width: "toggle"}, 150);
  }
}
