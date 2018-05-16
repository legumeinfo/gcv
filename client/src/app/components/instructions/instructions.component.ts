// Angular
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from "@angular/core";
// App
import { AppConfig } from "../../app.config";
import { elementIsVisible } from "../../utils/element-is-visible.util";

declare var $: any;

@Component({
  moduleId: module.id.toString(),
  selector: "instructions",
  styles: [ require("./instructions.component.scss") ],
  template: require("./instructions.component.html"),
})
export class InstructionsComponent implements AfterViewInit, OnDestroy {

  @ViewChild("searchScreenshot") searchScreenshotEl: ElementRef;
  @ViewChild("multiScreenshot") multiScreenshotEl: ElementRef;

  brand = AppConfig.BRAND;
  dashboard = AppConfig.DASHBOARD;
  copyrightYear = (new Date()).getFullYear();

  private searchPopover = false;
  private multiPopover = false;

  ngAfterViewInit() {
    $(this.searchScreenshotEl.nativeElement).popover({
      content: this.dashboard.search.caption,
      html: true,
    });
    $(this.multiScreenshotEl.nativeElement).popover({
      content: this.dashboard.multi.caption,
      html: true,
      placement: "left",
    });
    $(document).on('scroll', () => {
      if (elementIsVisible(this.searchScreenshotEl.nativeElement, true) && !this.searchPopover) {
        this.searchPopover = true;
        $(this.searchScreenshotEl.nativeElement).trigger("click");
      }
      if (elementIsVisible(this.multiScreenshotEl.nativeElement, true) && !this.multiPopover) {
        this.multiPopover = true;
        $(this.multiScreenshotEl.nativeElement).trigger("click");
      }
    });
  }

  ngOnDestroy() {
    $(this.searchScreenshotEl.nativeElement).popover("dispose");
    $(this.multiScreenshotEl.nativeElement).popover("dispose");
  }
}
