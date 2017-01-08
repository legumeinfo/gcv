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
    <form id="scroll-form" class="navbar-form form-inline navbar-right">
      <div class="input-group col-lg-12">
        <span class="input-group-btn">
          <button class="btn btn-default" type="button" (click)="scrollLeft(step.value)">
            &nbsp;<span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span>&nbsp;
          </button>
        </span>
        <input type="number" min="1" class="form-control" placeholder="<= Neighbors" value="{{this._maxStep}}" #step>
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
  //might want to revisit this when Alan is back on the case; it appears that
  //some of our most devoted users did not understand that the scroll control 
  //needed to be filled in with a number. this was my attempt to pre-fill with 
  //what seems to be the most sensible default. I suppose we could have also
  //used an alert to tell them that it needs to be filled in if the buttons are
  //clicked with no step being specified.
  private _maxStep: number;

  constructor(private _router: Router,
              private _alerts: AlertsService) { }

  ngOnChanges(changes: SimpleChanges) {
    if (this.query !== undefined && this.gene !== undefined) {
      let names = this.query.map(g => g.name);
      this._idx = names.indexOf(this.gene);
      this._maxStep = (this.query.length-1)/2;
    }
  }

  private _search(idx: number): void {
    let g = this.query[idx];
    this._router.navigateByUrl('/search/' + g.source + '/' + g.name);
  }

  private _stepSizeValid(stepNum: number): boolean {
    if (isNaN(stepNum) || stepNum <= 0) {
      this._alerts.pushAlert(new Alert(
          ALERT_WARNING,
        'Scrolling step size must be specified >= 1'
      ));
      return false;
    }
    return true;
  }

  scrollLeft(step: string): void {
    let stepNum = parseInt(step);
    if (! this._stepSizeValid(stepNum)) {
        return;
    }
    let idx = this._idx - stepNum;
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
    let stepNum = parseInt(step);
    if (! this._stepSizeValid(stepNum)) {
        return;
    }
    let idx = this._idx + stepNum;
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
