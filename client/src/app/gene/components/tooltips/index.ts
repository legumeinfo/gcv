import { geneTooltipComponent, GeneTooltipComponent } from './gene';
import { macroBlockTooltipComponent, MacroBlockTooltipComponent }
  from './macro-block';
import { processTooltipComponent, ProcessTooltipComponent } from './process';
import { plotTooltipComponent, PlotTooltipComponent } from './plot';
import { htmlTooltipComponent, HtmlTooltipComponent } from './html';

export const components: any[] = [
  GeneTooltipComponent,
  MacroBlockTooltipComponent,
  ProcessTooltipComponent,
  PlotTooltipComponent,
  HtmlTooltipComponent,
];

export const tooltipComponents: any[] = [
  geneTooltipComponent,
  macroBlockTooltipComponent,
  processTooltipComponent,
  plotTooltipComponent,
  htmlTooltipComponent,
];

export * from './gene';
export * from './macro-block';
export * from './process';
export * from './plot';
export * from './html';
