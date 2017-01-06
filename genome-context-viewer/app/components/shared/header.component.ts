// Angular
import { Component, Input, OnDestroy, OnInit } from '@angular/core';

// App
import { Alert }         from '../../models/alert.model';
import { ALERT_INFO }    from '../../constants/alerts';
import { AlertsService } from '../../services/alerts.service';

declare var $: any;

@Component({
  moduleId: module.id,
  selector: 'header',
  templateUrl: 'header.component.html',
  styleUrls: [ 'header.component.css' ]
})

export class HeaderComponent implements OnDestroy, OnInit {
  @Input() alerts: boolean = true;

  alert: Alert;

  private _sub;

  constructor(private _alerts: AlertsService) { }

  ngOnDestroy(): void {

  }

  ngOnInit(): void {
    this._sub = this._alerts.alerts.subscribe(alert => this.alert = alert);
    this.toggleBrand();
  }

  toggleBrand(): void {
    $('.navbar-brand span').animate({width: 'toggle'}, 150);
  }
}
