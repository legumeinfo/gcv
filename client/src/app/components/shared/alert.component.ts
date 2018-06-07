// Angular + dependencies
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges,
  Output, SimpleChanges } from "@angular/core";
import { Observable, interval } from "rxjs";
import { map, take } from "rxjs/operators";
// App
import { Alert } from "../../models";

@Component({
  selector: "alert",
  styleUrls: [ "./alert.component.scss" ],
  templateUrl: "./alert.component.html",
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
