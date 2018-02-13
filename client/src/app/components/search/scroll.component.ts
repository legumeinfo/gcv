// Angular
import { Component, ElementRef, Input, OnChanges, SimpleChanges,
  ViewChild } from "@angular/core";
import { Router } from "@angular/router";

// App
import { Alerts } from "../../constants/alerts";
import { Alert } from "../../models/alert.model";
import { Gene } from "../../models/gene.model";
import { AlertsService } from "../../services/alerts.service";

@Component({
  moduleId: module.id.toString(),
  selector: "scroll",
  styles: [ "form button { margin-right: 0; }" ],
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
})
export class ScrollComponent implements OnChanges {

  @Input() query: Gene[];
  @Input() gene: string;

  private idx: number;
  private maxScroll: number;

  constructor(private alerts: AlertsService,
              private router: Router) { }

  ngOnChanges(changes: SimpleChanges) {
    if (this.query !== undefined && this.gene !== undefined) {
      const names = this.query.map((g) => g.name);
      this.idx = names.indexOf(this.gene);
      this.maxScroll = (this.query.length - 1) / 2;
    }
  }

  maxStep(): number {
    return this.maxScroll;
  }

  scrollLeft(step: string): void {
    const stepNum = parseInt(step, 10);
    if (!this._stepSizeValid(stepNum)) {
      return;
    }
    const idx = this.idx - stepNum;
    if (idx >= 0) {
      this._search(idx);
    } else {
      this.alerts.pushAlert(new Alert(
        Alerts.ALERT_WARNING,
        "Scrolling step size must be <= current value of neighbors.",
      ));
    }
  }

  scrollRight(step: string): void {
    const stepNum = parseInt(step, 10);
    if (! this._stepSizeValid(stepNum)) {
        return;
    }
    const idx = this.idx + stepNum;
    if (idx < this.query.length) {
      this._search(idx);
    } else {
      this.alerts.pushAlert(new Alert(
          Alerts.ALERT_WARNING,
        "Scrolling step size must be <= current value of neighbors.",
      ));
    }
  }

  private _search(idx: number): void {
    const g = this.query[idx];
    this.router.navigateByUrl("/search/" + g.source + "/" + g.name);
  }

  private _stepSizeValid(stepNum: number): boolean {
    if (isNaN(stepNum) || stepNum <= 0) {
      this.alerts.pushAlert(new Alert(
        Alerts.ALERT_WARNING,
        "Scrolling step size must be specified >= 1",
      ));
      return false;
    }
    return true;
  }
}
