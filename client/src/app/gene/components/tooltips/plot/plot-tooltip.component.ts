// Angular
import { Component, EventEmitter, Output } from '@angular/core';


@Component({
  selector: 'gcv-plot-tooltip',
  template: `
    <a [routerLink]="" queryParamsHandling="preserve" (click)="local()">local</a>&nbsp;|&nbsp;<a [routerLink]="" queryParamsHandling="preserve" (click)="global()">global</a>
  `,
})
export class PlotTooltipComponent {

  @Output() localClick = new EventEmitter();
  @Output() globalClick = new EventEmitter();

  // public

  local(): void {
    this.localClick.emit();
  }

  global(): void {
    this.globalClick.emit();
  }
}
