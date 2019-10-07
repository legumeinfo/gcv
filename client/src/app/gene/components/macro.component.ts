// Angular + dependencies
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild }
  from '@angular/core';
import { GCV } from '@gcv-assets/js/gcv';

@Component({
  selector: 'macro',
  styles: [],
  template: '<div #container></div>',
})
export class MacroComponent implements AfterViewInit, OnDestroy {

  @ViewChild('container', {static: true}) container: ElementRef;

  ngAfterViewInit() {
    //const viewer = new GCV.visualization.Micro(this.container.nativeElement);
    this.container.nativeElement.innerHTML = 'macro-synteny viewer';
  }

  ngOnDestroy() {
    console.log('macro destroyed');
  }
}
