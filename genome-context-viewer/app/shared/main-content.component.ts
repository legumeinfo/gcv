import { Component } from '@angular/core';

@Component({
  moduleId: module.id,
  selector: 'main-content',
  template: '<div id="main-content"></div>',
  styles: [`
    width: 100%;
    position: absolute;
    top: 51px;
    bottom: 51px;
  `]
})

export class MainContentComponent { }
