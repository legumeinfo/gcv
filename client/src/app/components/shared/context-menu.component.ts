// Angular
import { Component,
         ElementRef,
         EventEmitter,
         Input,
         Output,
         ViewChild } from '@angular/core';

@Component({
  moduleId: module.id.toString(),
  selector: 'context-menu',
  templateUrl: 'context-menu.component.html',
  styleUrls: [ 'context-menu.component.css' ]
})

export class ContextMenuComponent {
  @Input() title: string;
  @Output() saveData = new EventEmitter();
  @Output() saveImage = new EventEmitter();

  @ViewChild('dropdown') el: ElementRef;

  private _hasContent(children: any): any {
    for (var i = 0; i < children.length; i++) {
      var c = children[i];
      if (c.className === undefined || c.className !== 'native') return true;
    }
    return false;
  }

  dataClick(): void {
    this.saveData.emit();
  }

  imageClick(): void {
    this.saveImage.emit();
  }

  showDropdown(): boolean {
    return this.saveData.observers.length > 0
        || this.saveImage.observers.length > 0
        || (this.el !== undefined
        && this._hasContent(this.el.nativeElement.children));
  }

  showSeparator(): boolean {
    return (this.saveData.observers.length > 0
        || this.saveImage.observers.length > 0)
        && (this.el !== undefined
        && this._hasContent(this.el.nativeElement.children));
  }
}
