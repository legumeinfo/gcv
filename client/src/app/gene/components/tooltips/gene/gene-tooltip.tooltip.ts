import { GeneTooltipComponent } from './gene-tooltip.component';


export const geneTooltipComponent =
  {component: GeneTooltipComponent, name: 'gene'};


export function geneTooltipConfigFactory(outputs: any={}, tipOptions: any={}) {
  let _outputs = {
      localClick: () => { /* no-op */ },
      globalClick: () => { /* no-op */ },
    };
  _outputs = Object.assign(_outputs, outputs);
  let _tipOptions = Object.assign({}, tipOptions);
  return  {
    componentName: 'gene',
    componentState: {
      inputs: {},
      outputs: _outputs,
    },
    tipOptions: _tipOptions,
  };
}
