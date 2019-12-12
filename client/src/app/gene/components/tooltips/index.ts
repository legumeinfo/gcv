import { geneTooltipComponent, GeneTooltipComponent } from './gene';
import { plotTooltipComponent, PlotTooltipComponent } from './plot';

export const components: any[] = [
  GeneTooltipComponent,
  PlotTooltipComponent,
];

export const tooltipComponents: any[] = [
  geneTooltipComponent,
  plotTooltipComponent,
];

export * from './gene';
export * from './plot';
