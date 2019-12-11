import { AlertComponent } from './alert.component';
import { GeneComponent } from './gene.component';
import { HeaderLeftComponent } from './header-left.component';
import { HeaderRightComponent } from './header-right.component';
import { InterAppCommunicationComponent } from './inter-app-communication.component';
import { LeftSliderComponent } from './left-slider.component';
import * as fromDetails from './details';
import * as fromForms from './forms';
import * as fromTooltips from './tooltips';
import * as fromViewers from './viewers';

export const components: any[] = [
  AlertComponent,
  GeneComponent,
  HeaderLeftComponent,
  HeaderRightComponent,
  InterAppCommunicationComponent,
  LeftSliderComponent,
  ...fromDetails.components,
  ...fromForms.components,
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

export * from './alert.component';
export * from './gene.component';
export * from './header-left.component';
export * from './header-right.component';
export * from './inter-app-communication.component';
export * from './left-slider.component';
export * from './details';
export * from './forms';
export * from './tooltips';
export * from './viewers';
