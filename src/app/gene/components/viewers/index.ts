import { ContextMenuComponent } from './context-menu';
import { macroLayoutComponent, MacroComponent } from './macro';
import { macroCircosLayoutComponent, MacroCircosComponent }
  from './macro-circos';
import { macroLegendLayoutComponent, MacroLegendComponent }
  from './macro-legend';
import { microLayoutComponent, MicroComponent } from './micro';
import { microLegendLayoutComponent, MicroLegendComponent }
  from './micro-legend';
import { plotLayoutComponent, PlotComponent } from './plot';

export const components: any[] = [
  ContextMenuComponent,
  MacroCircosComponent,
  MacroComponent,
  MacroLegendComponent,
  MicroComponent,
  MicroLegendComponent,
  PlotComponent,
];

export const layoutComponents: any[] = [
  macroCircosLayoutComponent,
  macroLayoutComponent,
  macroLegendLayoutComponent,
  microLayoutComponent,
  microLegendLayoutComponent,
  plotLayoutComponent,
];

export * from './context-menu';
export * from './macro';
export * from './macro-circos';
export * from './macro-legend';
export * from './micro';
export * from './micro-legend';
export * from './plot';
