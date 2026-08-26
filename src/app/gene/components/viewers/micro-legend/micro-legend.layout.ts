import { MicroLegendComponent } from './micro-legend.component';

export const microLegendLayoutComponent = {
  component: MicroLegendComponent,
  name: 'microlegend',
};

export function microLegendConfigFactory(outputs: any = {}) {
  const id = 'microlegend';
  const options = {};
  let _outputs = {
    click: (id, family) => {
      /* no-op */
    },
  };
  _outputs = Object.assign(_outputs, outputs);
  return {
    type: 'component',
    componentType: 'microlegend',
    id: id,
    title: 'Micro Synteny Legend',
    componentState: {
      inputs: { options },
      outputs: { clicked: (family) => _outputs.click(id, family) },
    },
    isClosable: false,
  };
}
