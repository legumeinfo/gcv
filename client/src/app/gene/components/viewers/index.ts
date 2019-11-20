import { ContextMenuComponent } from './context-menu';
import { macroCircosLayoutComponent, MacroCircosComponent }
  from './macro-circos';
import { macroLayoutComponent, MacroComponent } from './macro';
import { microLayoutComponent, MicroComponent } from './micro';
import { microLegendLayoutComponent, MicroLegendComponent }
  from './micro-legend';
import { plotLayoutComponent, PlotComponent } from './plot';

export const components: any[] = [
  ContextMenuComponent,
  MacroCircosComponent,
  MacroComponent,
  MicroComponent,
  MicroLegendComponent,
  PlotComponent,
];

export const layoutComponents: any[] = [
  macroCircosLayoutComponent,
  macroLayoutComponent,
  microLayoutComponent,
  microLegendLayoutComponent,
  plotLayoutComponent,
];

export * from './context-menu';
export * from './macro-circos';
export * from './macro';
export * from './micro';
export * from './micro-legend';
export * from './plot';
