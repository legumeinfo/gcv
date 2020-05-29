import { GoldenLayoutDirective } from './golden-layout.directive';
import { OnResizeDirective } from './on-resize.directive';
import { SidebarDirective } from './sidebar.directive';
import { SidebarToggleDirective } from './sidebar-toggle.directive';
import { TooltipFactoryDirective } from './tooltip-factory.directive';

export const directives: any[] = [
  GoldenLayoutDirective,
  OnResizeDirective,
  SidebarDirective,
  SidebarToggleDirective,
  TooltipFactoryDirective,
];

export * from './golden-layout.directive';
export * from './on-resize.directive';
export * from './sidebar.directive';
export * from './sidebar-toggle.directive';
export * from './tooltip-factory.directive';
