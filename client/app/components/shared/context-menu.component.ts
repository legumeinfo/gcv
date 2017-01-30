// Angular
import { AfterViewInit,
         Component,
         ElementRef,
         EventEmitter,
         Output,
         ViewChild } from '@angular/core';

@Component({
  moduleId: module.id,
  selector: 'context-menu',
  template : `
    <div class="wrapper" [hidden]="hidden" #popover>
      <div class="popover top" role="tooltip">
        <!--<div class="arrow"></div>-->
        <div class="popover-content">
          <div class="btn-group" role="group">
            <button type="button" class="btn btn-default"
              *ngIf="saveData.observers.length"
              (click)="dataClick()" >
              <span class="glyphicon glyphicon-download-alt" aria-hidden="true"></span>
            </button>
            <button type="button" class="btn btn-default"
              *ngIf="saveImage.observers.length"
              (click)="imageClick()" >
              <span class="glyphicon glyphicon-camera" aria-hidden="true"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .wrapper {
      position: absolute;
      -webkit-transform: translate(-50%, -100%);
    }
    .popover {
      border: none;
      display: block;
      padding: 0;
      position: relative;
    }
    .popover-content {
      padding: 0;
    }
  `]
})

export class ContextMenuComponent implements AfterViewInit {
  @Output() saveData = new EventEmitter();
  @Output() saveImage = new EventEmitter();

  @ViewChild('popover') popover: ElementRef;
  el;

  hidden = true;

  ngAfterViewInit(): void {
    this.el = this.popover.nativeElement;
  }

  dataClick(): void {
    this.saveData.emit();
  }

  imageClick(): void {
    this.saveImage.emit();
  }

  hide(): void {
    this.hidden = true;
  }

  show(x: number, y: number): void {
    this.hidden = false;
    this.el.style.left = x;
    this.el.style.top = y;
  }
}
