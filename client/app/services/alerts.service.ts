// Angular
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Injectable }      from '@angular/core';
import { Observable }      from 'rxjs/Observable';

// App
import { Alert }      from '../models/alert.model';
import { ALERT_INFO } from '../constants/alerts';

@Injectable()
export class AlertsService {
  private _alerts = new BehaviorSubject(new Alert(ALERT_INFO, ''));
  alerts = this._alerts.asObservable();

  pushAlert(a: Alert): void {
    this._alerts.next(a);
  }
}
