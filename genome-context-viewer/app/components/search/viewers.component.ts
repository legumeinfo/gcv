// TODO: should be implemented as directive or replaced with ng2-split (Split.js) directive once stable
import { AfterViewInit, Component, ElementRef, ViewChild, ViewEncapsulation } from '@angular/core';

declare var Split: any;

@Component({
  moduleId: module.id,
  selector: 'viewers',
  templateUrl: 'viewers.component.html',
  styleUrls: [ 'viewers.component.css' ],
  encapsulation: ViewEncapsulation.None
})

export class ViewersComponent implements AfterViewInit {
  @ViewChild('splitTop') splitTop: ElementRef;
  @ViewChild('splitBottom') splitBottom: ElementRef;

  ngAfterViewInit(): void {
    Split([this.splitTop.nativeElement, this.splitBottom.nativeElement], {
      direction: 'vertical',
      minSize: 0
    });
  }
}
