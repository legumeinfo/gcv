// Angular
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';


@Component({
    selector: 'gcv-html-tooltip',
    template: `<div [innerHTML]="html"></div>`,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class HtmlTooltipComponent {
  @Input() html: string;
}
