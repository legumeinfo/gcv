import { FamilyDetailComponent } from './family-detail.component';


export const familyDetailLayoutComponent =
  {component: FamilyDetailComponent, name: 'family'};


export function familyDetailConfigFactory(family: string) {
  const id = `family:${family}`;
  let title = family;
  if (title == '') {
    title = 'Orphans';
  } else if (title.split(',').length > 1) {
    title = 'Singletons';
  }
  return {
    type: 'component',
    componentName: 'family',
    id: id,
    title: `Family: ${title}`,
    componentState: {inputs: {family}}
  };
}
