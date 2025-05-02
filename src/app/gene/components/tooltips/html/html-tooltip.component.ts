// Angular
import { Component, Input } from '@angular/core';


@Component({
    selector: 'gcv-html-tooltip',
    template: `<div [innerHTML]="html"></div>`,
    standalone: false
})
export class HtmlTooltipComponent {
  @Input() html: string;
}
