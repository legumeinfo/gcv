// Angular
import { AfterViewInit, ElementRef, Input, OnChanges, OnDestroy,
  SimpleChanges, ViewChild } from "@angular/core";

export abstract class Viewer implements AfterViewInit, OnChanges, OnDestroy {

  // view children

  @ViewChild("viewerContainer", {static: true}) el: ElementRef;

  // variables
  title: string;
  viewer: any;

  // inputs

  @Input() data: any;
  @Input() colors: any;
  protected args;
  @Input()
  set arguments(args: object) {
    this.args = Object.assign({}, args);
  }

  // constructor

  constructor(private instanceTitle: string) {
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

  private _flattenObject(o: any): any {
    let flat = Object.create(o);
    for (let key in flat) {
      let value = flat[key];
      if (value instanceof Object) {
        flat[key] = this._flattenObject(value);
      } else {
        flat[key] = value;
      }
    }
    return flat;
  }

  // public

  saveAsJSON(data): void {
    const copy = this._flattenObject(data);
    this.saveFile(JSON.stringify(copy), "application/json", "json");
  }

  saveXMLasSVG(xml): void {
    this.saveFile(xml, "image/svg+xml", "svg");
  }

  // abstract

  abstract draw(): void;

  // private

  protected destroy(): void {
    if (this.viewer !== undefined) {
      this.viewer.destroy();
      this.viewer = undefined;
    }
  }

  protected saveFile(data, type, ext): void {
    const blob = new Blob([data], {type});
    // save the data
    const url = window.URL.createObjectURL(blob);
    const a: any = document.createElement("a");
    a.style = "display: none";
    a.href = url;
    const date = new Date();
    const prefix = (this.title !== undefined) ? this.title + "-" : "";
    a.download = prefix + date.toISOString() + "." + ext;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}
