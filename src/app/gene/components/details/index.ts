import { familyDetailLayoutComponent, FamilyDetailComponent } from './family';
import { geneDetailLayoutComponent, GeneDetailComponent } from './gene';
import { trackDetailLayoutComponent, TrackDetailComponent } from './track';

export const components: any[] = [
  FamilyDetailComponent,
  GeneDetailComponent,
  TrackDetailComponent,
];

export const layoutComponents: any[] = [
  familyDetailLayoutComponent,
  geneDetailLayoutComponent,
  trackDetailLayoutComponent,
];

export * from './family';
export * from './gene';
export * from './track';
