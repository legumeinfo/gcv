import { ContextMenuComponent } from './context-menu.component';
import { FamilyDetailComponent } from './family-detail.component';
import { GeneComponent } from './gene.component';
import { GeneDetailComponent } from './gene-detail.component';
import { HeaderLeftComponent } from './header-left.component';
import { LeftSliderComponent } from './left-slider.component';
import { MacroComponent } from './macro.component';
import { MicroLegendComponent } from './micro-legend.component';
import { MicroComponent } from './micro.component';
import { ParamsComponent } from './params.component';
import { PlotComponent } from './plot.component';
import { TrackDetailComponent } from './track-detail.component';
import * as fromShared from './shared';
import * as fromViewers from './viewers';

export const components: any[] = [
  ContextMenuComponent,
  FamilyDetailComponent,
  GeneComponent,
  GeneDetailComponent,
  HeaderLeftComponent,
  LeftSliderComponent,
  MacroComponent,
  MicroComponent,
  MicroLegendComponent,
  ParamsComponent,
  PlotComponent,
  TrackDetailComponent,
  ...fromShared.components,
  ...fromViewers.components
];

export * from './context-menu.component';
export * from './family-detail.component';
export * from './gene.component';
export * from './gene-detail.component';
export * from './header-left.component';
export * from './left-slider.component';
export * from './macro.component';
export * from './micro-legend.component';
export * from './micro.component';
export * from './params.component';
export * from './plot.component';
export * from './track-detail.component';
export * from './shared';
export * from './viewers';
