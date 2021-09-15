// Angular
import { Directive, HostListener, Input } from '@angular/core';
// app
import { SidebarDirective } from './sidebar.directive';
 
@Directive({
  selector: '[gcvSidebarToggle]'
})
export class SidebarToggleDirective {
  @Input('gcvSidebarToggle') sidebar: SidebarDirective;
   
  @HostListener('click')
  click() {
    this.sidebar.toggle();
  }
}
