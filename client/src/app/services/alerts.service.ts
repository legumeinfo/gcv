// Angular
import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { Observable } from "rxjs/Observable";

// App
import { Alerts } from "../constants/alerts";
import { Alert } from "../models/alert.model";

@Injectable()
export class AlertsService {
  alerts: Observable<Alert>;
  private alertsBehavior: BehaviorSubject<Alert>;

  constructor() {
    this.alertsBehavior = new BehaviorSubject(new Alert(Alerts.ALERT_INFO, ""));
    this.alerts = this.alertsBehavior.asObservable();
  }

  pushAlert(a: Alert): void {
    this.alertsBehavior.next(a);
  }
}
