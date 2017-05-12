// Angular
import { Component,
         ElementRef,
         EventEmitter,
         Input,
         Output,
         ContentChildren } from '@angular/core';

@Component({
  moduleId: module.id,
  selector: 'context-menu',
  templateUrl: 'context-menu.component.html',
  styleUrls: [ 'context-menu.component.css' ]
})

export class ContextMenuComponent {
  @Input() title: string;
  @Output() saveData = new EventEmitter();
  @Output() saveImage = new EventEmitter();

  @ContentChildren('item') items;

  dataClick(): void {
    this.saveData.emit();
  }

  imageClick(): void {
    this.saveImage.emit();
  }

  showDropdown(): boolean {
    return this.saveData.observers.length > 0
        || this.saveImage.observers.length > 0
        || (this.items !== undefined && this.items.length > 0);
  }

  showSeparator(): boolean {
    return (this.saveData.observers.length > 0
        || this.saveImage.observers.length > 0)
        && (this.items !== undefined && this.items.length > 0);
  }
}
