// Angular + dependencies
import { Component, Input } from "@angular/core";
import * as $ from "jquery";
// App
import { Alert } from "../../models/alert.model";

@Component({
  moduleId: module.id.toString(),
  selector: "alert",
  styles: [ require("./alert.component.scss") ],
  template: require("./alert.component.html"),
})
export class AlertComponent {
  @Input() data: Alert;
  @Input() float?: boolean = false;
}
