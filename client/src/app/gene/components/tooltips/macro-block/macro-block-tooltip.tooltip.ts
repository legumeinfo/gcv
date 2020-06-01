import { MacroBlockTooltipComponent } from './macro-block-tooltip.component';


export const macroBlockTooltipComponent =
  {component: MacroBlockTooltipComponent, name: 'macroblock'};


export function macroBlockTooltipConfigFactory(inputs: any, tipOptions: any={})
{
  let _tipOptions = {
      offset: [0, 20],
      sticky: true,
    };
  _tipOptions = Object.assign(_tipOptions, tipOptions);
  return  {
    componentName: 'macroblock',
    componentState: {
      inputs,
      outputs: {},
    },
    tipOptions: _tipOptions,
  };
}
