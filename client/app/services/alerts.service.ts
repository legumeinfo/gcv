// Angular
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Injectable }      from '@angular/core';
import { Observable }      from 'rxjs/Observable';

// App
import { Alert }  from '../models/alert.model';
import { Alerts } from '../constants/alerts';

@Injectable()
export class AlertsService {
  private _alerts = new BehaviorSubject(new Alert(Alerts.ALERT_INFO, ''));
  alerts = this._alerts.asObservable();

  pushAlert(a: Alert): void {
    this._alerts.next(a);
  }
}
