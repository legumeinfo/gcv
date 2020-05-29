import { GeneTooltipComponent } from './gene-tooltip.component';


export const geneTooltipComponent =
  {component: GeneTooltipComponent, name: 'gene'};


export function geneTooltipConfigFactory(inputs: any, tipOptions: any={}) {
  let _tipOptions = {
      offset: [0, 20],
      sticky: true,
    };
  _tipOptions = Object.assign(_tipOptions, tipOptions);
  return  {
    componentName: 'gene',
    componentState: {
      inputs,
      outputs: {},
    },
    tipOptions: _tipOptions,
  };
}
