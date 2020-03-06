// Angular
import { Component, Input } from '@angular/core';


@Component({
  selector: 'html-tooltip',
  template: `<div [innerHTML]="html"></div>`,
})
export class HtmlTooltipComponent {
  @Input() html: string;
}
