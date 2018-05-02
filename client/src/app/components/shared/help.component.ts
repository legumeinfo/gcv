import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { Observable } from "rxjs/Observable";

const SELECTOR = "gcv-help";

@Component({
  moduleId: module.id.toString(),
  selector: SELECTOR,
  styles: [`
    .alert-dismissible button.close {
      margin-left:10px;
    }
  `],
  template: `
    <div class="alert alert-info alert-dismissible" role="alert" [hidden]="!show">
      <button type="button" class="close" data-dismiss="alert" aria-label="Close"
          (click)="close()" >
        <span aria-hidden="true">
          <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
        </span>
      </button>
      <button type="button" class="close" data-dismiss="alert" aria-label="Got it"
          (click)="closeSave()" >
        <span aria-hidden="true">
          <span class="glyphicon glyphicon-floppy-remove" aria-hidden="true"></span>
        </span>
      </button>
      <h4>{{name}}</h4>
      <p>
        <ng-content></ng-content>
      </p>
    </div>
  `,
})
export class HelpComponent implements OnDestroy, OnInit {
  @Input() name: string;
  @Input() showing: Observable<boolean>;

  show: boolean;
  private sub: any;
  private helpID: string;

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  ngOnInit(): void {
    this.sub = this.showing.subscribe((showing) => {
      this.show = showing;
      this._save();
    });
    this.helpID = SELECTOR + "-" + this.name;
    const prev = localStorage.getItem(this.helpID);
    if (prev !== null) {
      this.show = (prev === "true");
    }
  }

  close(): void {
    this.show = false;
  }

  closeSave(): void {
    this.close();
    this._save();
  }

  private _save(): void {
    localStorage.setItem(this.helpID, this.show.toString());
  }
}
