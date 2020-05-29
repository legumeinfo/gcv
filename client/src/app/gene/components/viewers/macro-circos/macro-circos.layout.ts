import { MacroCircosComponent } from './macro-circos.component';


export const macroCircosLayoutComponent =
  {component: MacroCircosComponent, name: 'macrocircos'};


export function macroCircosConfigFactory(clusterID: number, outputs: any={}) {
  const id = `macrocircos:${clusterID}`;
  const options = {/*,replicateBlocks: true*/};
  let _outputs = {};
  _outputs = Object.assign(_outputs, outputs);
  return  {
    type: 'component',
    componentName: 'macrocircos',
    id: id,
    title: `Cluster ${clusterID} Circos`,
    componentState: {
      inputs: {clusterID, options},
      outputs: _outputs,
    },
  };
}
