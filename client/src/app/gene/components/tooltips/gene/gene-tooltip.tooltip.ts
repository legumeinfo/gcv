import { GeneTooltipComponent } from './gene-tooltip.component';


export const geneTooltipComponent =
  {component: GeneTooltipComponent, name: 'gene'};


export function geneTooltipConfigFactory(inputs: any, tipOptions: any={}) {
  let _tipOptions = Object.assign({distance: 20}, tipOptions);
  return  {
    componentName: 'gene',
    componentState: {
      inputs,
      outputs: {},
    },
    tipOptions: _tipOptions,
  };
}
