import { LegacyMultiRouteGuard } from './legacy-multi-route.guard';
import { LegacySearchRouteGuard } from './legacy-search-route.guard';

export const guards: any[] = [
  LegacyMultiRouteGuard,
  LegacySearchRouteGuard,
];

export * from './legacy-multi-route.guard';
export * from './legacy-search-route.guard';
