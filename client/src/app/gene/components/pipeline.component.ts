// Angular
import { Component, Input, ViewChild } from '@angular/core';
// app
import {
  htmlTooltipComponent, htmlTooltipConfigFactory,
  processTooltipComponent, processTooltipConfigFactory,
} from '@gcv/gene/components/tooltips';
import { TooltipFactoryDirective } from '@gcv/gene/directives';
import { Pipeline, Process, ProcessStatus, ProcessStream }
  from '@gcv/gene/models';
import { statusToClass, statusToIcon } from './pipeline.shim';


@Component({
  selector: 'gcv-pipeline',
  styleUrls: ['./pipeline.component.scss'],
  templateUrl: 'pipeline.component.html',
})
export class PipelineComponent { 

  @ViewChild(TooltipFactoryDirective, {static: true}) tooltipFactoryDirective;

  // IO

  @Input() info?: string;
  @Input() pipeline: Pipeline;
  get processNames(): string[] {
    return Reflect.ownKeys(this.pipeline) as string[];
  }

  // variables

  tooltipComponents = [htmlTooltipComponent, processTooltipComponent];

  private _tipOptions = {placement: 'bottom'};

  // public methods

  getProcess(name: string): ProcessStream {
    return this.pipeline[name];
  }

  statusToClass(status: ProcessStatus): string {
    const c = statusToClass(status);
    return `alert-${c}`;
  }

  statusToIcon(status: ProcessStatus): string {
    return statusToIcon(status);
  }

  infoTooltip(e, html: string): void {
    const inputs = {html};
    const config = htmlTooltipConfigFactory(inputs, this._tipOptions);
    this.tooltipFactoryDirective.componentTip(e.target, config);
  }

  processTooltip(e, process: Process): void {
    const inputs = {process};
    const config = processTooltipConfigFactory(inputs, this._tipOptions);
    this.tooltipFactoryDirective.componentTip(e.target, config);
  }

}
