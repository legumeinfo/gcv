import { GeneComponent } from './gene.component';
import { HeaderLeftComponent } from './header-left.component';
import { LeftSliderComponent } from './left-slider.component';
import { ParamsComponent } from './params.component';
import * as fromDetails from './details';
import * as fromShared from './shared';
import * as fromTooltips from './tooltips';
import * as fromViewers from './viewers';

export const components: any[] = [
  GeneComponent,
  HeaderLeftComponent,
  LeftSliderComponent,
  ParamsComponent,
  ...fromDetails.components,
  ...fromShared.components,
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
export * from './header-left.component';
export * from './left-slider.component';
export * from './params.component';
export * from './details';
export * from './shared';
export * from './tooltips';
export * from './viewers';
