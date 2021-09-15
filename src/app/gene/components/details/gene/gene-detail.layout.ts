import { GeneDetailComponent } from './gene-detail.component';


export const geneDetailLayoutComponent = 
  {component: GeneDetailComponent, name: 'gene'};


export function geneDetailConfigFactory(gene, family, source) {
  const id = `gene:${gene}:${source}`;
  return {
    type: 'component',
    componentName: 'gene',
    id: id,
    title: `Gene ${gene}`,
    componentState: {inputs: {gene, family, source}}
  };
}
