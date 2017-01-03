// Angular
import { Component,
         Input,
         OnChanges,
         SimpleChanges } from '@angular/core';
import { Router }        from '@angular/router';

// App
import { Gene } from '../../models/gene.model';
import { Alert }               from '../../models/alert.model';
import { ALERT_SUCCESS,
         ALERT_INFO,
         ALERT_WARNING,
         ALERT_DANGER }        from '../../constants/alerts';
import { AlertsService }       from '../../services/alerts.service';

@Component({
  moduleId: module.id,
  selector: 'scroll',
  template: `
    <form class="navbar-form form-inline navbar-right">
      <div class="input-group col-lg-12">
        <span class="input-group-btn">
          <button class="btn btn-default" type="button" (click)="scrollLeft(step.value)">
            &nbsp;<span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span>&nbsp;
          </button>
        </span>
        <input type="number" min="1" class="form-control" placeholder="<= Neighbors" #step>
        <span class="input-group-btn">
          <button class="btn btn-default" type="button" (click)="scrollRight(step.value)">
            &nbsp;<span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span>&nbsp;
          </button>
        </span>
      </div>
    </form>
  `,
  styles: [ '' ]
})

export class ScrollComponent implements OnChanges {
  @Input() query: Gene[];
  @Input() gene: string;

  private _idx: number;

  constructor(private _router: Router,
              private _alerts: AlertsService) { }

  ngOnChanges(changes: SimpleChanges) {
    if (this.query !== undefined && this.gene !== undefined) {
      let names = this.query.map(g => g.name);
      this._idx = names.indexOf(this.gene);
    }
  }

  private _search(idx: number): void {
    let g = this.query[idx];
    this._router.navigateByUrl('/search/' + g.source + '/' + g.name);
  }

  scrollLeft(step: string): void {
    let idx = this._idx - parseInt(step);
    if (idx >= 0)
      this._search(idx);
    else {
      this._alerts.pushAlert(new Alert(
          ALERT_WARNING,
        'Scrolling step size must be <= current value of neighbors.'
      ));
    }
  }

  scrollRight(step: string): void {
    let idx = this._idx + parseInt(step);
    if (idx < this.query.length)
      this._search(idx);
    else {
      this._alerts.pushAlert(new Alert(
          ALERT_WARNING,
        'Scrolling step size must be <= current value of neighbors.'
      ));
    }
  }
}
