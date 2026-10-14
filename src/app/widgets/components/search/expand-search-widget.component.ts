// Angular
import {
  Component,
  ElementRef,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
// App
import { AbstractSearchWidgetComponent } from './abstract-search-widget.component';

@Component({
  selector: 'gcv-expand-search-widget',
  styleUrls: ['./expand-search-widget.component.scss'],
  templateUrl: './expand-search-widget.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class ExpandSearchWidgetComponent extends AbstractSearchWidgetComponent {
  @ViewChild('searchField') searchField: ElementRef;

  active: boolean = false;

  toggle(e): void {
    e.preventDefault();
    this.active = !this.active;
    if (this.active) {
      this.searchField.nativeElement.focus();
    }
  }
}
