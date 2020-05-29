import { FamilyDetailComponent } from './family-detail.component';


export const familyDetailLayoutComponent =
  {component: FamilyDetailComponent, name: 'family'};


export function familyDetailConfigFactory(family: {id: string, name: string}) {
  const id = `family:${family.id}`;
  return {
    type: 'component',
    componentName: 'family',
    id,
    title: `Family: ${family.name}`,
    componentState: {inputs: {family}}
  };
}
