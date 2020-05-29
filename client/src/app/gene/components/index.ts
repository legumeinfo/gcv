import { GeneComponent } from './gene.component';
import { InterAppCommunicationComponent } from './inter-app-communication.component';
import { LeftSliderComponent } from './left-slider.component';
import { PipelineComponent } from './pipeline.component';
import * as fromDetails from './details';
import * as fromForms from './forms';
import * as fromHeader from './header';
import * as fromTooltips from './tooltips';
import * as fromViewers from './viewers';

export const components: any[] = [
  GeneComponent,
  InterAppCommunicationComponent,
  LeftSliderComponent,
  PipelineComponent,
  ...fromDetails.components,
  ...fromForms.components,
  ...fromHeader.components,
  ...fromTooltips.components,
  ...fromViewers.components,
];

export const layoutComponents: any[] = [
  ...fromDetails.layoutComponents,
  ...fromViewers.layoutComponents,
];

export const tooltipComponents: any[] = [
  ...fromTooltips.tooltipComponents,
];

export * from './gene.component';
export * from './inter-app-communication.component';
export * from './left-slider.component';
export * from './pipeline.component';
export * from './details';
export * from './forms';
export * from './header';
export * from './tooltips';
export * from './viewers';
