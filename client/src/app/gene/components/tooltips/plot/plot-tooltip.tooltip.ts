import { PlotTooltipComponent } from './plot-tooltip.component';


export const plotTooltipComponent =
  {component: PlotTooltipComponent, name: 'plot'};


export function plotTooltipConfigFactory(outputs: any={}, tipOptions: any={}) {
  let _outputs = {
      localClick: () => { /* no-op */ },
      globalClick: () => { /* no-op */ },
    };
  _outputs = Object.assign(_outputs, outputs);
  let _tipOptions = {
      interactive: true,
      trigger: 'click',
    };
  _tipOptions = Object.assign(_tipOptions, tipOptions);
  return  {
    componentName: 'plot',
    componentState: {
      inputs: {},
      outputs: _outputs,
    },
    tipOptions: _tipOptions,
    hideOutputs: ['localClick', 'globalClick'],
  };
}
