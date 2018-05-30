import { Component } from "@angular/core";

@Component({
  selector: "main-content",
  styles: [`
    #main-content {
      width: 100%;
      position: absolute;
      top: 50px;
      bottom: 0;
    }
  `],
  template: `
    <div id="main-content">
      <ng-content></ng-content>
    </div>
  `,
})
export class MainContentComponent { }
