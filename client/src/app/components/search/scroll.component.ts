// Angular
import { Component, ElementRef, EventEmitter, Output } from "@angular/core";
// App
import { catchError } from "rxjs/operators";
import { MicroTracksService } from "../../services";

@Component({
  selector: "scroll",
  styles: [ "form button { margin-right: 0; }" ],
  template: `
    <form>
      <div class="input-group">
        <span class="input-group-btn">
          <button class="btn btn-default" type="button" (click)="scrollLeft(step.value)">
            &nbsp;<span class="fa fa-chevron-left" aria-hidden="true"></span>&nbsp;
          </button>
        </span>
        <input type="number" min="1" class="form-control" placeholder="e.g. 10" #step>
        <span class="input-group-btn">
          <button class="btn btn-default" type="button" (click)="scrollRight(step.value)">
            &nbsp;<span class="fa fa-chevron-right" aria-hidden="true"></span>&nbsp;
          </button>
        </span>
      </div>
    </form>
  `,
})
export class ScrollComponent {

  @Output() onError = new EventEmitter<any>();

  constructor(private microTracksService: MicroTracksService) { }

  scrollLeft(step: string): void {
    this._scroll(-parseInt(step, 10));
  }

  scrollRight(step: string): void {
    this._scroll(parseInt(step, 10));
  }

  private _scroll(step: number): void {
    this.microTracksService.scroll(step)
      .subscribe(
        () => { },
        (error) => {
          this.onError.emit(error);
        });
  }
}
