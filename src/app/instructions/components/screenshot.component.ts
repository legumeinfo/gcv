// Angular
import { Component, ElementRef, Input, ViewChild } from '@angular/core';
// app
import { AppConfig, DashboardView } from '@gcv/core/models';


declare var $: any;  // jQuery


@Component({
  selector: 'gcv-screenshot',
  styleUrls: [ './screenshot.component.scss' ],
  templateUrl: './screenshot.component.html',
})
export class ScreenshotComponent {

  @Input() screenshot: DashboardView;
  @Input() alt: string;
  @ViewChild('modal', {static: true}) modal: ElementRef;

  toggleModal(event): void {
    $(this.modal.nativeElement).modal('toggle');
  }

}
