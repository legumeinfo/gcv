import { ProcessTooltipComponent } from './process-tooltip.component';


export const processTooltipComponent =
  {component: ProcessTooltipComponent, name: 'process'};


export function processTooltipConfigFactory(inputs: any={}, tipOptions: any={}) {
  let _inputs = {};
  _inputs = Object.assign(_inputs, inputs);
  let _tipOptions = {
      interactive: true,
      trigger: 'click',
    };
  _tipOptions = Object.assign(_tipOptions, tipOptions);
  return  {
    componentName: 'process',
    componentState: {
      inputs: _inputs,
      outputs: {},
    },
    tipOptions: _tipOptions,
    hideOutputs: [],
  };
}
