// Angular
import { Component,
         ElementRef,
         Input,
         OnChanges,
         SimpleChanges,
         ViewChild } from '@angular/core';
import { Router }    from '@angular/router';

// App
import { Alert }         from '../../models/alert.model';
import { Alerts }        from '../../constants/alerts';
import { AlertsService } from '../../services/alerts.service';
import { Gene }          from '../../models/gene.model';

@Component({
  moduleId: module.id.toString(),
  selector: 'scroll',
  template: `
    <form>
      <div class="input-group">
        <span class="input-group-btn">
          <button class="btn btn-default" type="button" (click)="scrollLeft(step.value)">
            &nbsp;<span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span>&nbsp;
          </button>
        </span>
        <input type="number" min="1" class="form-control" placeholder="<= Neighbors" value="{{maxStep()}}" #step>
        <span class="input-group-btn">
          <button class="btn btn-default" type="button" (click)="scrollRight(step.value)">
            &nbsp;<span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span>&nbsp;
          </button>
        </span>
      </div>
    </form>
  `,
  styles: [ 'form button { margin-right: 0; }' ]
})

export class ScrollComponent implements OnChanges {

  @Input() query: Gene[];
  @Input() gene: string;

  private _idx: number;
  private _maxStep: number;

  constructor(private _alerts: AlertsService,
              private _router: Router) { }

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
        Alerts.ALERT_WARNING,
        'Scrolling step size must be specified >= 1'
      ));
      return false;
    } return true;
  }

  maxStep(): number {
    return this._maxStep;
  }

  scrollLeft(step: string): void {
    let stepNum = parseInt(step);
    if (!this._stepSizeValid(stepNum)) return;
    let idx = this._idx - stepNum;
    if (idx >= 0)
      this._search(idx);
    else
      this._alerts.pushAlert(new Alert(
        Alerts.ALERT_WARNING,
        'Scrolling step size must be <= current value of neighbors.'
      ));
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
          Alerts.ALERT_WARNING,
        'Scrolling step size must be <= current value of neighbors.'
      ));
    }
  }
}
