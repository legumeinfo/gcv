// Angular
import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy,
  SimpleChanges, ViewChild } from '@angular/core';

@Component({
  moduleId: module.id.toString(),
  selector: 'viewer',
  template: '',
  styles: [ '' ]
})

export abstract class Viewer implements AfterViewInit, OnChanges, OnDestroy {

  // inputs

  @Input() data: any;
  @Input() colors: any;
  protected args;
  @Input()
  set arguments(args: Object) {
    this.args = Object.assign({}, args);
  }

  // view children

  @ViewChild('viewerContainer') el: ElementRef;

  // variables
  title: String;
  viewer: any;

  // constructor

  constructor(private instanceTitle: String) {
    this.title = instanceTitle;
  }

  // Angular hooks

  ngAfterViewInit(): void {
    this.draw();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.draw();
  }

  ngOnDestroy(): void {
    this.destroy();
  }

  // private

  protected destroy(): void {
    if (this.viewer !== undefined) {
      this.viewer.destroy();
      this.viewer = undefined;
    }
  }

  protected saveFile(data, type, ext): void {
    let blob = new Blob([data], {type: type});
    // save the data
    let url = window.URL.createObjectURL(blob);
    let a: any = document.createElement('a');
    a.style = 'display: none';
    a.href = url;
    let date = new Date();
    let prefix = (this.title !== undefined) ? this.title + '-' : '';
    a.download = prefix + date.toISOString() + '.' + ext;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  // public

  saveAsJSON(data): void {
    this.saveFile(JSON.stringify(data), 'application/json', 'json');
  }

  saveXMLasSVG(xml): void {
    this.saveFile(xml, 'image/svg+xml', 'svg');
  }

  // abstract

  abstract draw(): void;
}
