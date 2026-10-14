import { MacroLegendComponent } from './macro-legend.component';

export const macroLegendLayoutComponent = {
  component: MacroLegendComponent,
  name: 'macrolegend',
};

export function macroLegendConfigFactory(outputs: any = {}) {
  const id = 'macrolegend';
  const options = {};
  let _outputs = {
    click: (id, organism) => {
      /* no-op */
    },
  };
  _outputs = Object.assign(_outputs, outputs);
  return {
    type: 'component',
    componentType: 'macrolegend',
    id: id,
    title: 'Macro Synteny Legend',
    componentState: {
      inputs: { options },
      outputs: { clicked: (organism) => _outputs.click(id, organism) },
    },
    isClosable: false,
  };
}
