// Angular
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter,
  Input, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'gcv-context-menu',
  styleUrls: ['./context-menu.component.scss'],
  templateUrl: './context-menu.component.html',
})
export class ContextMenuComponent implements AfterViewInit {

  @Output() saveData = new EventEmitter();
  @Output() saveImage = new EventEmitter();

  @ViewChild('dropdown') el: ElementRef;

  constructor(private changeDetector: ChangeDetectorRef) { }

  // Angular hooks

  ngAfterViewInit(): void {
    this.changeDetector.detectChanges();
  }

  dataClick(): void {
    this.saveData.emit();
  }

  imageClick(): void {
    this.saveImage.emit();
  }

  // private

  private _hasContent(children: any): any {
    for (const c of children) {
      if (!c.className.includes('native') && c.className !== 'dropdown-divider') {
        return true;
      }
    }
    return false;
  }

  // private

  showData(): boolean {
    return this.saveData.observers.length > 0;
  }

  showImage(): boolean {
    return this.saveImage.observers.length > 0;
  }

  showDropdown(): boolean {
    return this.showData()
        || this.showImage()
        || (this.el !== undefined
        && this._hasContent(this.el.nativeElement.children));
  }

  showSeparator(): boolean {
    return (this.showData()
        || this.showImage())
        && (this.el !== undefined
        && this._hasContent(this.el.nativeElement.children));
  }

}
