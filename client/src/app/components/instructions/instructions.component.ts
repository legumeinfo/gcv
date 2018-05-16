// Angular
import { AfterViewInit, Component, ElementRef, ViewChild } from "@angular/core";
// App
import { elementIsVisible } from "../../utils/element-is-visible.util";

declare var $: any;

@Component({
  moduleId: module.id.toString(),
  selector: "instructions",
  styles: [ require("./instructions.component.scss") ],
  template: require("./instructions.component.html"),
})
export class InstructionsComponent implements AfterViewInit {

  @ViewChild("searchScreenshot") searchScreenshotEl: ElementRef;
  @ViewChild("multiScreenshot") multiScreenshotEl: ElementRef;

  copyrightYear = (new Date()).getFullYear();

  private searchPopover = false;
  private multiPopover = false;

  ngAfterViewInit() {
    $(this.searchScreenshotEl.nativeElement).popover();
    $(this.multiScreenshotEl.nativeElement).popover({placement: "left"});
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
}
