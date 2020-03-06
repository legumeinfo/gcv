import { HtmlTooltipComponent } from './html-tooltip.component';


export const htmlTooltipComponent =
  {component: HtmlTooltipComponent, name: 'html'};


export function htmlTooltipConfigFactory(inputs: any={}, tipOptions: any={}) {
  let _inputs = {};
  _inputs = Object.assign(_inputs, inputs);
  let _tipOptions = {
      interactive: true,
      trigger: 'click',
    };
  _tipOptions = Object.assign(_tipOptions, tipOptions);
  return  {
    componentName: 'html',
    componentState: {
      inputs: _inputs,
      outputs: {},
    },
    tipOptions: _tipOptions,
    hideOutputs: [],
  };
}
