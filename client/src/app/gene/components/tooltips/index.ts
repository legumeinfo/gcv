import { geneTooltipComponent, GeneTooltipComponent } from './gene';
import { macroBlockTooltipComponent, MacroBlockTooltipComponent }
  from './macro-block';
import { plotTooltipComponent, PlotTooltipComponent } from './plot';

export const components: any[] = [
  GeneTooltipComponent,
  MacroBlockTooltipComponent,
  PlotTooltipComponent,
];

export const tooltipComponents: any[] = [
  geneTooltipComponent,
  macroBlockTooltipComponent,
  plotTooltipComponent,
];

export * from './gene';
export * from './macro-block';
export * from './plot';
