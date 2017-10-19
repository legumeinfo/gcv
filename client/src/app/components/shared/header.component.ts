// Angular + dependencies
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import * as $                                  from 'jquery';

// App
import { Alert }         from '../../models/alert.model';
import { AlertsService } from '../../services/alerts.service';

@Component({
  moduleId: module.id.toString(),
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
