// Angular + dependencies
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges,
  Output, SimpleChanges } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { interval } from "rxjs/observable/interval";
import { map, take } from "rxjs/operators";
// App
import { Alert } from "../../models/alert.model";

@Component({
  moduleId: module.id.toString(),
  selector: "alert",
  styles: [ require("./alert.component.scss") ],
  template: require("./alert.component.html"),
})
export class AlertComponent implements OnChanges {
  @Input() alert: Alert;
  @Input() float?: boolean = false;
  @Output() onClose? = new EventEmitter<void>();

  className: string;
  closeCountDown: Observable<number>;

  ngOnChanges(changes: SimpleChanges) {
    if (this.alert.options.autoClose > 0) {
      this.closeCountDown = interval(1000).pipe(
        take(this.alert.options.autoClose),
        map((n) => this.alert.options.autoClose - n - 1),
      );
      this.closeCountDown
        .subscribe((n) => { }, (e) => { }, this.close);
    }
    const classes = ["alert", "alert-" + this.alert.type];
    if (this.float) {
      classes.push("float");
    }
    this.className = classes.join(" ");
  }

  close(): void {
    if (this.onClose !== undefined) {
      this.onClose.emit();
    }
  }
}
