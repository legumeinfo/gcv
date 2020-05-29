import { MacroComponent } from './macro.component';


export const macroLayoutComponent = {component: MacroComponent, name: 'macro'};


export function macroConfigFactory(
  name: string,
  source: string,
  clusterID: number,
  outputs: any={})
{
  // NOTE: should the id include end genes?
  const id = `macro:${name}:${source}`;
  const options = {};
  let _outputs = {
      blockOver: (e, pairwiseBlocks, block) => { /* no-op */ },
    };
  _outputs = Object.assign(_outputs, outputs);
  return  {
    type: 'component',
    componentName: 'macro',
    id: id,
    title: `${name} (cluster ${clusterID}) Macro Synteny`,
    componentState: {
      inputs: {name, source, clusterID, options},
      outputs: {
        blockOver: ({event, pairwiseBlocks, block}) => {
          _outputs.blockOver(event, pairwiseBlocks, block);
        },
      },
    },
  };
}
